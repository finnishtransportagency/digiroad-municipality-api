import { Feature, TrafficSignProperties } from '@functions/typing';
import { Client } from 'pg';
import execUpdated from './execUpdated';

export default async function (
  feature: Feature,
  municipality_code: number,
  dbmodifier: string,
  client: Client
) {
  const trafficSignProperties: TrafficSignProperties =
    feature.properties as TrafficSignProperties;

  const assetTypeID = 220;

  const checkExistingAssetQuery = {
    text: `
      SELECT id
      FROM asset
      WHERE external_id=($1) AND municipality_code=($2) AND asset_type_id=($3) AND valid_to IS NULL
    `,
    values: [trafficSignProperties.ID, municipality_code, assetTypeID]
  };

  const checkExistingAssetResult = await client.query(checkExistingAssetQuery);

  if (checkExistingAssetResult.rowCount > 0) {
    await execUpdated(feature, municipality_code, dbmodifier, client);
    return;
  }

  const point = `Point(${trafficSignProperties.DR_GEOMETRY.x} ${trafficSignProperties.DR_GEOMETRY.y} 0 0 )`;
  const assetQuery = {
    text: `
        INSERT INTO asset (id, created_date, geometry, created_by, asset_type_id, municipality_code, external_id) 
        VALUES (nextval('PRIMARY_KEY_SEQ'), CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Helsinki', ST_GeomFromText(($1),3067), $2, $3, $4, $5);
        `,
    values: [
      point,
      dbmodifier,
      assetTypeID,
      municipality_code,
      trafficSignProperties.ID
    ]
  };
  await client.query(assetQuery);

  const lrmPositionQuery = {
    text: `
        INSERT INTO lrm_position (id, start_measure, link_id)
        VALUES (nextval('LRM_POSITION_PRIMARY_KEY_SEQ'), $1, $2)
        `,
    values: [trafficSignProperties.DR_M_VALUE, trafficSignProperties.DR_LINK_ID]
  };
  await client.query(lrmPositionQuery);

  const assetLinkQuery = {
    text: `
        INSERT INTO asset_link (asset_id, position_id)
        VALUES (currval('PRIMARY_KEY_SEQ'), currval('LRM_POSITION_PRIMARY_KEY_SEQ'))
        `,
    values: []
  };
  await client.query(assetLinkQuery);

  const singleChoiceValueQuery = {
    text: `
        WITH _property AS (
          SELECT id
          FROM property 
          WHERE public_id=($1)
        ), _enumerated_value AS (
          SELECT enumerated_value.id
          FROM enumerated_value, _property
          WHERE property_id = _property.id AND value=($2)
        )

        INSERT INTO single_choice_value (asset_id, enumerated_value_id, property_id, modified_date, modified_by)
        VALUES (currval('PRIMARY_KEY_SEQ'), (SELECT id FROM _enumerated_value), (SELECT id FROM _property), CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Helsinki', ($3))
    `,
    values: ['esterakennelma', trafficSignProperties.LM_TYYPPI, dbmodifier]
  };
  await client.query(singleChoiceValueQuery);

  const valueQuery = {
    text: `
    WITH _property AS (
      SELECT id
      FROM property 
      WHERE public_id=($1)
    )

    INSERT INTO text_property_value (id, asset_id, property_id, value_fi, created_date, created_by,grouped_id)
    VALUES (nextval('PRIMARY_KEY_SEQ'),currval('PRIMARY_KEY_SEQ), (SELECT id FROM _property), ($2) ,CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Helsinki', ($3))
    `,
    values: ['trafficSigns_value', trafficSignProperties.ARVO, dbmodifier]
  };

  await client.query(valueQuery);

  //terrainX

  //terrainY

  //type

  if (trafficSignProperties.TEKSTI) {
    return;
  } // no else

  if (trafficSignProperties.LISATIETO) {
    return;
  } // no else

  if (trafficSignProperties.RAKENNE) {
    return;
  } else {
    //enum value
  }

  if (trafficSignProperties.KUNTO) {
    return;
  } else {
    //enum value
  }

  if (trafficSignProperties.KOKO) {
    return;
  } else {
    //enum value
  }

  for (const i in trafficSignProperties.LISAKILVET) {
    return;
  }

  return;
}
