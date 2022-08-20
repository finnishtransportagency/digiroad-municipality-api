import * as yup from 'yup';

const propertiesSchema = yup.object().shape({
  ID: yup.number().required(),
  EST_TYYPPI: yup.number().required()
});

const geometrySchema = yup.object().shape({
  type: yup
    .string()
    .required()
    .matches(/(Point)/),
  coordinates: yup.array().of(yup.number().required()).length(2)
});

const featureSchema = yup.object().shape({
  type: yup.string().required(),
  properties: propertiesSchema,
  geometry: geometrySchema
});

const crsSchema = yup.object().shape({
  type: yup.string().notRequired(),
  properties: yup
    .object()
    .shape({
      name: yup.string().notRequired()
    })
    .notRequired()
});

const schema = yup.object().shape({
  type: yup
    .string()
    .required()
    .matches(/(FeatureCollection)/),
  name: yup.string().notRequired(),
  crs: crsSchema.notRequired(),
  features: yup.array().of(featureSchema)
});

export { schema };