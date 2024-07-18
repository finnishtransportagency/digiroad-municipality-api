import {
  AssetTypeString,
  isAssetTypeKey,
  isScheduleEvent
} from '@customTypes/eventTypes';
import {
  AdditionalPanelType,
  Feature,
  FeatureCollection,
  InvalidFeature,
  TrafficSignType,
  ValidFeature
} from '@customTypes/featureTypes';
import {
  fetchSize,
  offline,
  offlineApiKey,
  stage,
  bbox,
  bucketName
} from '@functions/config';
import { getDistance, similarBearing } from '@libs/spatial-tools';
import { middyfy } from '@libs/lambda-tools';
import { uploadToS3 } from '@libs/s3-tools';
import { getParameter } from '@libs/ssm-tools';
import { trafficSignFeatureSchema } from '@schemas/geoJsonSchema';
import {
  infraoJsonSchema,
  infraoObstacleSchema,
  infraoTrafficSignSchema
} from '@schemas/muniResponseSchema';
import { createTrafficSignText, trafficSignRules } from '@schemas/trafficSignTypes';
import axios from 'axios';

const parseFeature = (assetType: AssetTypeString, feature: unknown): Feature => {
  try {
    switch (assetType) {
      case 'infrao:Rakenne': {
        const castedFeature = infraoObstacleSchema.cast(feature);
        const properties = castedFeature.properties;
        const id = properties.yksilointitieto;
        const coordinates = castedFeature.geometry.coordinates;

        if (!infraoObstacleSchema.isValidSync(castedFeature))
          return {
            type: 'Invalid',
            id: id,
            properties: {
              reason: 'Does not match infraoObstacleSchema',
              feature: JSON.stringify(feature)
            }
          };

        return {
          type: 'Feature',
          id: castedFeature.id,
          properties: {
            TYPE: 'OBSTACLE',
            ID: String(id),
            EST_TYYPPI: properties.malli === 'Pollari' ? 1 : 2
          },
          geometry: {
            type: 'Point',
            coordinates: [coordinates[0], coordinates[1]]
          }
        };
      }

      case 'infrao:Liikennemerkki': {
        const castedFeature = infraoTrafficSignSchema.cast(feature);
        const properties = castedFeature.properties;
        const id = properties.yksilointitieto;

        if (!infraoTrafficSignSchema.isValidSync(castedFeature))
          return {
            type: 'Invalid',
            id: id,
            properties: {
              reason: 'Does not match infraoTrafficSignSchema',
              feature: JSON.stringify(feature)
            }
          };

        const trafficSignCode =
          properties.liikennemerkkityyppi2020 === 'INVALID_CODE'
            ? properties.liikennemerkkityyppi
            : properties.liikennemerkkityyppi2020;

        if (trafficSignCode === 'INVALID_CODE')
          return {
            type: 'Invalid',
            id: id,
            properties: {
              reason: 'Invalid liikennemerkkityyppi & liikennemerkkityyppi2020',
              feature: JSON.stringify(feature)
            }
          };

        const coordinates = castedFeature.geometry.coordinates;
        const geoJson = trafficSignFeatureSchema.cast({
          type: 'Feature',
          id: castedFeature.id,
          properties: {
            TYPE: trafficSignCode[0] === 'H' ? 'ADDITIONALPANEL' : 'TRAFFICSIGN',
            ID: String(id),
            SUUNTIMA: properties.suunta ? properties.suunta * (180 / Math.PI) : 0,
            LM_TYYPPI: createTrafficSignText(trafficSignCode),
            // TODO: Set ARVO only on corresponding traffic signs. e.g. speed limit signs (check trafficSignRules)
            ARVO: Object.keys(trafficSignRules).includes(
              properties.liikennemerkkityyppi2020
            )
              ? Number(properties.teksti)
              : null,
            TEKSTI: properties.teksti
              ? properties.teksti.substring(0, 128)
              : properties.teksti,
            ...(!(trafficSignCode[0] === 'H') && {
              LISAKILVET: []
            })
          },
          geometry: {
            type: 'Point',
            coordinates: [coordinates[0], coordinates[1]]
          }
        });

        // TODO: Validate geoJson

        return geoJson;
      }

      case 'infrao:KatualueenOsa':
        //TODO: Implement
        console.warn(`${assetType} not yet implemented in parseFeature`);
        break;

      default:
        console.warn('Asset type not supported by parseFeature:', assetType);
    }
  } catch (e: unknown) {
    if (!(e instanceof Error)) throw e;
    console.error('Error in parseFeature:', e.message);
    console.info('Invalid feature:', feature);
    return {
      type: 'Invalid',
      id: -1,
      properties: {
        reason: e.message,
        feature: JSON.stringify(feature)
      }
    };
  }
  return {
    type: 'Invalid',
    id: -1,
    properties: {
      reason: `Asset type not supported by parseFeature: ${assetType ?? 'undefined'}`,
      feature: JSON.stringify(feature)
    }
  };
};

/**
 * Goes through all traffic signs and adds additional panels to the main signs LISAKILVET array
 *
 * @param features All traffic signs to be matched
 * @returns Main traffic signs with additional panels added to them
 */
const matchAdditionalPanels = (features: Array<Feature>): Array<ValidFeature> => {
  const validFeatures = features.filter((f): f is ValidFeature => f.type === 'Feature');
  const additionalPanels = validFeatures.filter(
    (f): f is AdditionalPanelType => f.properties.TYPE === 'ADDITIONALPANEL'
  );
  const mainPanels = validFeatures.filter(
    (f): f is TrafficSignType => f.properties.TYPE === 'TRAFFICSIGN'
  );
  const rejectedAdditionalPanels: Array<Feature> = [];
  for (const additionalPanel of additionalPanels) {
    let matched = false;
    for (const mainPanel of mainPanels) {
      const distance = getDistance(
        additionalPanel.geometry.coordinates,
        mainPanel.geometry.coordinates
      );
      if (
        'SUUNTIMA' in additionalPanel.properties &&
        additionalPanel.properties.SUUNTIMA !== undefined &&
        'SUUNTIMA' in mainPanel.properties &&
        mainPanel.properties.SUUNTIMA !== undefined
      ) {
        if (
          distance <= 2 &&
          similarBearing(
            additionalPanel.properties.SUUNTIMA,
            mainPanel.properties.SUUNTIMA
          )
        ) {
          if (
            'LISAKILVET' in mainPanel.properties &&
            mainPanel.properties.LISAKILVET !== undefined
          ) {
            mainPanel.properties.LISAKILVET.push(additionalPanel.properties);
            matched = true;
            break;
          }
        }
      }
    }
    if (!matched) {
      rejectedAdditionalPanels.push(additionalPanel);
    }
  }

  return mainPanels;
};

const fetchAndParseData = async (event: unknown) => {
  if (!isScheduleEvent(event)) {
    throw new Error('Invalid event');
  }

  const assetTypeKeys = Object.keys(event.assetTypes).filter(isAssetTypeKey);
  if (assetTypeKeys.length === 0) {
    throw new Error('No valid asset types provided');
  }

  const apiKey = offline
    ? offlineApiKey
    : await getParameter(`/DRKunta/${stage}/${event.municipality}`);

  for (const assetKey of assetTypeKeys) {
    switch (event.format) {
      case 'json': {
        const geoJson: FeatureCollection = await fetchJsonData(
          event.assetTypes[assetKey],
          event.municipality,
          event.url,
          apiKey
        );
        await uploadToS3(
          bucketName,
          `geojson/${event.municipality}/${assetKey}/${new Date()
            .toISOString()
            .slice(0, 19)}.json`,
          JSON.stringify(geoJson)
        );
        break;
      }

      case 'gml' || 'xml': {
        const dataArray: Array<string> = await fetchXmlData(
          event.assetTypes[assetKey],
          event.url,
          apiKey
        );
        console.log('XML dataArray:', dataArray);
        // TODO: Parse XML data
        // TODO: Save GeoJSON to S3
        console.warn(`${event.format} parsing not yet implemented`);
        break;
      }

      default:
        console.warn(
          'API response type not supported by fetchAndParseData:',
          event.format
        );
        break;
    }
  }
};

const fetchJsonData = async (
  assetType: AssetTypeString,
  municipality: string,
  baseUrl: string,
  apiKey: string
): Promise<FeatureCollection> => {
  let page = 0;
  const geoJson: FeatureCollection = {
    type: 'FeatureCollection',
    name: `${municipality}-Kuntarajapinta`,
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::3067'
      }
    },
    features: [],
    invalidInfrao: {
      sum: 0,
      IDs: []
    }
  };

  while (true) {
    console.info('Fetching page:', page);
    const { data }: { data: unknown } = await axios.get(
      `${baseUrl}/collections/${
        assetType as string
      }/items?f=json&crs=http://www.opengis.net/def/crs/EPSG/0/3067&limit=${fetchSize}&offset=${
        page * fetchSize
      }${bbox}`,
      {
        headers: {
          Authorization: apiKey
        }
      }
    );
    const infraoFeatureCollection = infraoJsonSchema.validateSync(data);
    const parsedFeatures: Array<Feature> = infraoFeatureCollection.features.map(
      (feature) => parseFeature(assetType, feature)
    );

    const validFeatures = parsedFeatures.filter(
      (f): f is ValidFeature => f.type === 'Feature'
    );
    const invalidFeatures = parsedFeatures.filter(
      (f): f is InvalidFeature => f.type === 'Invalid'
    );

    geoJson.features.push(...validFeatures);
    geoJson.invalidInfrao.sum += invalidFeatures.length;
    geoJson.invalidInfrao.IDs.push(...invalidFeatures.map((f) => Number(f.id)));

    if (infraoFeatureCollection.numberReturned < fetchSize) break;
    page++;
  }

  if (assetType === 'infrao:Liikennemerkki') {
    const matchedPanels = matchAdditionalPanels(geoJson.features);
    geoJson.features = matchedPanels;
  }

  return geoJson;
};

const fetchXmlData = async (
  assetType: AssetTypeString,
  baseUrl: string,
  apiKey: string
): Promise<Array<string>> => {
  let page = 0;
  const dataArray: Array<string> = [];

  while (true) {
    const { data }: { data: unknown } = await axios.get(
      `${baseUrl}/collections/${
        assetType as string
      }/items?f=xml&crs=http://www.opengis.net/def/crs/EPSG/0/3067&limit=${fetchSize}&offset=${
        page * fetchSize
      }${bbox}`,
      {
        headers: {
          Authorization: apiKey
        }
      }
    );
    if (typeof data !== 'string' || !data.includes('sf:featureMember')) break;
    dataArray.push(data);
    page++;
  }
  return dataArray;
};

export const main = middyfy(fetchAndParseData);
