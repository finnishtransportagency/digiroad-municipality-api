import {
  AssetTypeString,
  isAssetTypeKey,
  isScheduleEvent
} from '@customTypes/eventTypes';
import {
  Feature,
  FeatureCollection,
  InvalidFeature,
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
import { middyfy } from '@libs/lambda-tools';
import { uploadToS3 } from '@libs/s3-tools';
import { getParameter } from '@libs/ssm-tools';
import { infraoJsonSchema, helsinkiJsonSchema } from '@schemas/muniResponseSchema';
import axios from 'axios';
import parseFeature from './parseFeature';
import matchAdditionalPanels from './matchAdditionalPanels';
import { SignMap } from '@customTypes/mapTypes';
import helsinkiSignMapParser from './parseFeature/helsinki/helsinkiSignMapParser';

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

      case 'gml':
      case 'xml': {
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
      case 'helsinki': {
        const geoJson: FeatureCollection = await fetchHelsinkiData(
          event.assetTypes[assetKey],
          event.municipality,
          event.url
        );
        await uploadToS3(
          bucketName,
          `geojson/helsinki/${assetKey}/${new Date().toISOString().slice(0, 19)}.json`,
          JSON.stringify(geoJson)
        );
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
    geoJson.invalidInfrao.IDs.push(...invalidFeatures.map((f) => f.id));

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

const fetchHelsinkiData = async (
  assetType: AssetTypeString,
  municipality: string,
  baseUrl: string
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
  const response = await axios.get(
    `${baseUrl}/traffic-control-device-types/?target_model=traffic_sign&limit=700`
  );
  const typeData = response.data as unknown;
  const signMap = helsinkiJsonSchema.validateSync(typeData);
  const parsedSignMap: Array<SignMap> = signMap.results.map((feature) =>
    helsinkiSignMapParser(feature)
  );
  while (true) {
    console.info('Fetching page:', page);
    const { data }: { data: unknown } = await axios.get(
      `${baseUrl}/${assetType as string}/?geo_format=geojson&limit=${fetchSize}&offset=${
        page * fetchSize
      }`
    );
    const helsinkiFeatureCollection = helsinkiJsonSchema.validateSync(data);
    const parsedFeatures: Array<Feature> = helsinkiFeatureCollection.results.map(
      (feature) => parseFeature(assetType, feature, parsedSignMap)
    );
    const validFeatures = parsedFeatures.filter(
      (f): f is ValidFeature => f.type === 'Feature'
    );
    const invalidFeatures = parsedFeatures.filter(
      (f): f is InvalidFeature => f.type === 'Invalid'
    );

    geoJson.features.push(...validFeatures);
    geoJson.invalidInfrao.sum += invalidFeatures.length;
    geoJson.invalidInfrao.IDs.push(...invalidFeatures.map((f) => f.id));

    if (!helsinkiFeatureCollection.next) break;
    page++;
  }
  return geoJson;
};

export const main = middyfy(fetchAndParseData);
