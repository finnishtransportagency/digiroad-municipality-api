import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      s3: {
        bucket: `dr-kunta-${process.env.STAGE_NAME}-bucket`,
        event: 's3:ObjectCreated:*',
        existing: true,
        rules: [{ prefix: 'update/' }]
      }
    }
  ]
};
