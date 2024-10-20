import { MatchedFeature, ValidFeature } from '@customTypes/featureTypes';
import {
  additionalPanelQuery,
  checkExistingAssetQuery,
  expireQuery,
  insertAssetLinkQuery,
  insertAssetQuery,
  insertLrmPositionQuery,
  insertNumberQuery,
  insertSingleChoiceQuery,
  insertTextQuery
} from '@libs/pg-tools';
import { assetTypeIdMap } from '@schemas/dbIdMapping';
import { expireResultSchema, insertAssetResultSchema } from '@schemas/dbSchemas';
import { GeoJsonFeatureType } from '@schemas/geoJsonSchema';
import { Client } from 'pg';

const execInsert = async (
  feature: MatchedFeature,
  municipality_code: number,
  dbmodifier: string,
  client: Client
): Promise<void> => {
  const featureProperties = feature.properties;
  if (!featureProperties.DR_GEOMETRY) return;

  const assetTypeID = assetTypeIdMap[featureProperties.TYPE];

  const checkExistingAssetResult = await client.query(
    checkExistingAssetQuery(featureProperties.ID, municipality_code, assetTypeID)
  );

  const expireResult = checkExistingAssetResult.rowCount
    ? await client.query(
        expireQuery(dbmodifier, featureProperties.ID, municipality_code, assetTypeID)
      )
    : undefined;

  const createdData = expireResult
    ? expireResultSchema.validateSync(expireResult.rows[0] as unknown)
    : undefined;

  const point = `Point(${featureProperties.DR_GEOMETRY.x} ${featureProperties.DR_GEOMETRY.y} 0 0 )`;

  const assetResult = insertAssetResultSchema.validateSync(
    (
      await client.query(
        insertAssetQuery(
          point,
          dbmodifier,
          assetTypeID,
          municipality_code,
          featureProperties.ID,
          returnBearing(featureProperties),
          createdData !== undefined,
          createdData ? createdData.created_by : undefined,
          createdData ? createdData.created_date : undefined
        )
      )
    ).rows[0] as unknown
  );
  const assetID = assetResult.id;
  const sideCode =
    featureProperties.TYPE === GeoJsonFeatureType.TrafficSign
      ? featureProperties.TOWARDSDIGITIZING
        ? 2
        : 3
      : undefined;

  const positionId = insertAssetResultSchema.validateSync(
    (
      await client.query(
        insertLrmPositionQuery(
          featureProperties.DR_M_VALUE,
          featureProperties.DR_LINK_ID,
          sideCode
        )
      )
    ).rows[0] as unknown
  ).id;

  await client.query(insertAssetLinkQuery(assetID, positionId));

  switch (featureProperties.TYPE) {
    case GeoJsonFeatureType.Obstacle:
      await client.query(
        insertSingleChoiceQuery(
          'esterakennelma',
          featureProperties.EST_TYYPPI,
          assetID,
          dbmodifier
        )
      );
      break;
    case GeoJsonFeatureType.TrafficSign:
      if (featureProperties.ARVO) {
        await client.query(
          insertTextQuery(
            'trafficSigns_value',
            assetID,
            featureProperties.ARVO,
            dbmodifier
          )
        );
      }
      await client.query(
        insertNumberQuery(
          'terrain_coordinates_x',
          assetID,
          feature.geometry.coordinates[0]
        )
      );
      await client.query(
        insertNumberQuery(
          'terrain_coordinates_y',
          assetID,
          feature.geometry.coordinates[1]
        )
      );
      await client.query(
        insertSingleChoiceQuery(
          'trafficSigns_type',
          featureProperties.LM_TYYPPI,
          assetID,
          dbmodifier,
          1
        )
      );
      if (featureProperties.TEKSTI) {
        await client.query(
          insertTextQuery('main_sign_text', assetID, featureProperties.TEKSTI, dbmodifier)
        );
      }
      if (featureProperties.LISATIETO) {
        await client.query(
          insertTextQuery(
            'trafficSigns_info',
            assetID,
            featureProperties.LISATIETO,
            dbmodifier
          )
        );
      }
      if (featureProperties.RAKENNE) {
        await client.query(
          insertSingleChoiceQuery(
            'structure',
            featureProperties.RAKENNE,
            assetID,
            dbmodifier
          )
        );
      }
      if (featureProperties.KUNTO) {
        await client.query(
          insertSingleChoiceQuery(
            'condition',
            featureProperties.KUNTO,
            assetID,
            dbmodifier
          )
        );
      }
      if (featureProperties.KOKO) {
        await client.query(
          insertSingleChoiceQuery('size', featureProperties.KOKO, assetID, dbmodifier)
        );
      }
      if (featureProperties.LISAKILVET.length > 0) {
        await Promise.all(
          featureProperties.LISAKILVET.slice(0, 5).map(async (panel, i: number) => {
            await client.query(
              additionalPanelQuery(
                panel.LM_TYYPPI,
                assetID,
                i,
                panel.ARVO,
                panel.TEKSTI || undefined,
                panel.KOKO || undefined,
                panel.KALVON_TYYPPI || undefined,
                panel.VARI || undefined
              )
            );
          })
        );
      }
      break;
    default:
      console.warn(`ExecSQL: FeatureType not supported.`);
      break;
  }
};

const returnBearing = (featureProperties: ValidFeature['properties']) => {
  if (featureProperties.TYPE === GeoJsonFeatureType.TrafficSign)
    return featureProperties.SUUNTIMA;
  return undefined;
};

export default execInsert;
