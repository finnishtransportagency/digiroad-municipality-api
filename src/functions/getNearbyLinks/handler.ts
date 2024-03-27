import { middyfy } from '@libs/lambda-tools';
import { Client } from 'pg';
import { Geometry, LineString, Point } from 'wkx';
import {
  offline,
  pghost,
  pgport,
  pgdatabase,
  pguser,
  pgpassword,
  allowedOnKapy
} from '@functions/config';
import { getParameter } from '@libs/ssm-tools';
import { getFromS3, uploadToS3 } from '@libs/s3-tools';
import { S3KeyObject } from '@functions/typing';

const getNearbyLinks = async (event: S3KeyObject) => {
  const data = await getFromS3(
    `dr-kunta-${process.env.STAGE_NAME}-bucket`,
    event.key
  );
  const requestPayload = JSON.parse(data) as unknown;

  const client = new Client({
    host: pghost,
    port: parseInt(pgport),
    database: pgdatabase,
    user: pguser,
    password: offline ? pgpassword : await getParameter(pgpassword)
  });
  await client.connect();

  const pointQuery = {
    text: `
    WITH municipality_ AS (
      SELECT id
      FROM municipality
      WHERE LOWER(name_fi) = LOWER($1)
      ), 
      acceptable_roadlinks AS (
        SELECT linkid, shape, directiontype, functional_class, roadname_fi
        FROM kgv_roadlink, municipality_, functional_class
        WHERE kgv_roadlink.municipalitycode = municipality_.id AND kgv_roadlink.linkid = functional_class.link_id AND not EXISTS(
        SELECT 1
        FROM administrative_class 
        WHERE administrative_class.link_id = kgv_roadlink.linkid AND administrative_class.administrative_class = 1
        ) AND (kgv_roadlink.adminclass != 1 OR kgv_roadlink.adminclass IS NULL)
      )
      
      SELECT (value#>'{properties}'->>'ID')::TEXT AS ID, (value#>'{properties}'->>'TYPE')::TEXT AS TYPE,json_agg((st_astext(shape),linkid,directiontype, roadname_fi)) AS roadlinks
      FROM json_array_elements($2) AS features, acceptable_roadlinks
      WHERE ST_BUFFER(ST_SETSRID(ST_GeomFromGeoJSON(features->>'geometry'), 3067), 5) && acceptable_roadlinks.shape 
        AND ((features#>'{properties}'->>'TYPE') != 'TRAFFICSIGN' OR (features#>'{properties}'->>'LM_TYYPPI') = ANY(($3)::text[]) OR acceptable_roadlinks.functional_class != 8)
      GROUP BY ID,TYPE
      `,
    values: [
      requestPayload.municipality,
      JSON.stringify(requestPayload.features),
      allowedOnKapy
    ]
  };
  const areaQuery = {
    text: `
    WITH municipality_ AS (
      SELECT id
      FROM municipality
      WHERE LOWER(name_fi) = LOWER($1)
      ), 
      acceptable_roadlinks AS (
        SELECT linkid, shape, geometrylength
        FROM kgv_roadlink, municipality_
        WHERE kgv_roadlink.municipalitycode = municipality_.id AND not EXISTS(
        SELECT 1
        FROM administrative_class 
        WHERE administrative_class.link_id = kgv_roadlink.linkid AND administrative_class.administrative_class = 1
        ) AND (kgv_roadlink.adminclass != 1 OR kgv_roadlink.adminclass IS NULL)
      )
      
      SELECT (value#>'{properties}'->>'ID')::TEXT AS ID, (value#>'{properties}'->>'TYPE')::TEXT AS TYPE,json_agg((st_astext(shape),linkid,geometrylength)) AS roadlinks
      FROM json_array_elements($2) AS features, acceptable_roadlinks
      WHERE ST_SETSRID(ST_GeomFromGeoJSON(features->>'geometry'), 3067) && acceptable_roadlinks.shape 
      GROUP BY ID,TYPE
      `,
    values: [
      requestPayload.municipality,
      JSON.stringify(requestPayload.features)
    ]
  };
  const query =
    requestPayload.assetType === 'roadSurfaces' ? areaQuery : pointQuery;

  const res = await client.query(query);
  client.end();

  res.rows.forEach((row) => {
    row.roadlinks.forEach((roadlink) => {
      const feature = Geometry.parse(`SRID=3067;${roadlink.f1}`) as LineString;
      const pointObjects: Array<Point> = feature.points;
      roadlink.linkId = roadlink.f2;
      roadlink.points = pointObjects;
      delete roadlink.f1;
      delete roadlink.f2;
      if (requestPayload.assetType === 'roadSurfaces') {
        roadlink.geometrylength = roadlink.f3;
      } else {
        roadlink.directiontype = roadlink.f3;
        roadlink.roadname = roadlink.f4;
        delete roadlink.f3;
        delete roadlink.f4;
      }
    });
  });

  const now = new Date().toISOString().slice(0, 19);

  const S3ObjectKey = `getNearbyLinks/${requestPayload.municipality}/${now}.json`;
  await uploadToS3(
    `dr-kunta-${process.env.STAGE_NAME}-bucket`,
    S3ObjectKey,
    JSON.stringify(res.rows)
  );

  return { key: S3ObjectKey };
};

export const main = middyfy(getNearbyLinks);
