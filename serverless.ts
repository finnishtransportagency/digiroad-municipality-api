import type { AWS } from '@serverless/typescript';

import {
  calculateDelta,
  matchRoadLink,
  reportRejectedDelta,
  getNearbyLinks,
  execDelta2SQL,
  parseXML,
  fetchMunicipalityData,
  createSchedule,
  listSchedules,
  deleteSchedule
} from '@functions/index';

const serverlessConfiguration: AWS = {
  service: 'DRKunta',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-s3-local'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: process.env.STAGE_NAME,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      ...(process.env.STAGE_NAME === 'dev' && {
        apiKeys: [`DRKuntaOperatorKey`]
      }),
      ...((process.env.STAGE_NAME === 'test' ||
        process.env.STAGE_NAME === 'prod') && {
        resourcePolicy: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: ['execute-api:/*']
          },
          {
            Effect: 'Deny',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: ['execute-api:/*'],
            Condition: {
              StringNotEquals: {
                'aws:SourceVpce': { Ref: 'drKuntaEndpoint' }
              }
            }
          }
        ]
      })
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      STAGE_NAME: process.env.STAGE_NAME,
      OPERATOR_EMAIL: process.env.OPERATOR_EMAIL,
      DIGIROADSECURITYGROUPID: process.env.DIGIROADSECURITYGROUPID,
      DIGIROADSUBNETAID: process.env.DIGIROADSUBNETAID,
      DIGIROADSUBNETBID: process.env.DIGIROADSUBNETBID,
      AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID
    },
    region: 'eu-west-1',
    ...((process.env.STAGE_NAME === 'test' ||
      process.env.STAGE_NAME === 'prod') && {
      endpointType: 'PRIVATE',
      vpcEndpointIds: [{ Ref: 'drKuntaEndpoint' }],
      vpc: {
        securityGroupIds: [process.env.SECURITYGROUPID],
        subnetIds: [process.env.SUBNETAID, process.env.SUBNETBID]
      }
    }),
    vpc: {
      securityGroupIds: [process.env.SECURITYGROUPID],
      subnetIds: [process.env.SUBNETAID, process.env.SUBNETBID]
    }
  },
  // import the function via paths
  functions: {
    parseXML,
    calculateDelta,
    matchRoadLink,
    reportRejectedDelta,
    getNearbyLinks,
    execDelta2SQL,
    fetchMunicipalityData,
    createSchedule,
    listSchedules,
    deleteSchedule
  },
  resources: {
    Resources: {
      ...((process.env.STAGE_NAME === 'test' ||
        process.env.STAGE_NAME === 'prod') && {
        VpceSecurityGroup: {
          Type: 'AWS::EC2::SecurityGroup',
          Properties: {
            GroupDescription: `DRKunta-${process.env.STAGE_NAME}-vpce-security-group`,
            GroupName: `DRKunta-${process.env.STAGE_NAME}-vpce-security-group`,
            SecurityGroupEgress: [
              {
                CidrIp: '0.0.0.0/0',
                Description: 'Allow all outbound traffic by default',
                IpProtocol: '-1'
              }
            ],
            SecurityGroupIngress: [
              {
                CidrIp: '0.0.0.0/0',
                FromPort: 443,
                IpProtocol: 'tcp',
                ToPort: 443
              },
              {
                CidrIpv6: '::/0',
                FromPort: 443,
                IpProtocol: 'tcp',
                ToPort: 443
              }
            ],
            VpcId: process.env.VPCID
          }
        },
        drKuntaEndpoint: {
          Type: 'AWS::EC2::VPCEndpoint',
          Properties: {
            PrivateDnsEnabled: false,
            SecurityGroupIds: [{ Ref: 'VpceSecurityGroup' }],
            ServiceName: 'com.amazonaws.eu-west-1.execute-api',
            SubnetIds: [process.env.SUBNETAID, process.env.SUBNETBID],
            VpcEndpointType: 'Interface',
            VpcId: process.env.VPCID,
            PolicyDocument: {
              Statement: [
                {
                  Principal: '*',
                  Action: ['execute-api:Invoke'],
                  Effect: 'Allow',
                  Resource: [
                    `arn:aws:execute-api:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*/*`
                  ]
                }
              ]
            }
          }
        }
      }),
      drKuntaScheduleGroup: {
        Type: 'AWS::Scheduler::ScheduleGroup',
        Properties: {
          Name: `DRKunta-${process.env.STAGE_NAME}`
        }
      },
      drKuntaBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: `dr-kunta-${process.env.STAGE_NAME}-bucket`,
          LifecycleConfiguration: {
            Rules: [
              {
                ExpirationInDays: 30,
                Prefix: '/matchRoadLink/',
                Status: 'Enabled'
              },
              {
                ExpirationInDays: 30,
                Prefix: '/getNearbyLinks/',
                Status: 'Enabled'
              },
              {
                ExpirationInDays: 30,
                Prefix: '/calculateDelta/',
                Status: 'Enabled'
              },
              {
                ExpirationInDays: 30,
                Prefix: '/infrao/',
                Status: 'Enabled'
              }
            ]
          }
        }
      },
      createScheduleRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-createScheduleRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-createSchedulePolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['ssm:DescribeParameters'],
                    Resource: [
                      `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'ssm:GetParameter',
                      'ssm:GetParameters',
                      'ssm:PutParameter',
                      'ssm:DeleteParameter'
                    ],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter/DRKunta/${process.env.STAGE_NAME}/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['scheduler:CreateSchedule'],
                    Resource: `arn:aws:scheduler:eu-west-1:${process.env.AWS_ACCOUNT_ID}:schedule/DRKunta-${process.env.STAGE_NAME}/DRKunta-${process.env.STAGE_NAME}-*`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  },
                  {
                    Action: ['iam:PassRole'],
                    Resource: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityDataScheduleRole`,
                    Effect: 'Allow'
                  }
                ]
              }
            }
          ]
        }
      },
      deleteScheduleRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-deleteScheduleRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-deleteSchedulePolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['ssm:DescribeParameters'],
                    Resource: [
                      `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'ssm:GetParameter',
                      'ssm:GetParameters',
                      'ssm:DeleteParameter'
                    ],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter/DRKunta/${process.env.STAGE_NAME}/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'scheduler:GetSchedule',
                      'scheduler:DeleteSchedule'
                    ],
                    Resource: `arn:aws:scheduler:eu-west-1:${process.env.AWS_ACCOUNT_ID}:schedule/DRKunta-${process.env.STAGE_NAME}/DRKunta-${process.env.STAGE_NAME}-*`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  }
                ]
              }
            }
          ]
        }
      },
      listSchedulesRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-listSchedulesRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-listSchedulesPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['scheduler:ListSchedules'],
                    Resource: `arn:aws:scheduler:eu-west-1:${process.env.AWS_ACCOUNT_ID}:schedule/*/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['scheduler:GetSchedule'],
                    Resource: `arn:aws:scheduler:eu-west-1:${process.env.AWS_ACCOUNT_ID}:schedule/DRKunta-${process.env.STAGE_NAME}/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  }
                ]
              }
            }
          ]
        }
      },
      fetchMunicipalityDataScheduleRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityDataScheduleRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'scheduler.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityDataSchedulePolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: [
                      `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityData:*`,
                      `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityData`
                    ]
                  }
                ]
              }
            }
          ]
        }
      },
      fetchMunicipalityDataRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityDataRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-fetchMunicipalityDataPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['ssm:DescribeParameters'],
                    Resource: [
                      `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter/DRKunta/${process.env.STAGE_NAME}/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:PutObjectAcl'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/infrao/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  }
                ]
              }
            }
          ]
        }
      },
      calculateDeltaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-calculateDeltaRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-calculateDeltaPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:ListBucket',
                      's3:GetObject',
                      's3:DeleteObject'
                    ],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/geojson/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-matchRoadLink`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-reportRejectedDelta`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-group:/aws/lambda/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:PutObjectAcl'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/calculateDelta/*`
                  }
                ]
              }
            }
          ]
        }
      },
      parseXMLRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-parseXMLRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-parseXMLPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket', 's3:GetObject'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/infrao/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:PutObjectAcl'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/geojson/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-reportRejectedDelta`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-group:/aws/lambda/*`
                  }
                ]
              }
            }
          ]
        }
      },
      DBLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-DBLambdaRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-DBLambdaPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['ssm:DescribeParameters'],
                    Resource: [
                      `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter${process.env.PGPASSWORD_SSM_KEY}`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket', 's3:GetObject'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/matchRoadLink/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:PutObjectAcl'],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/getNearbyLinks/*`
                  }
                ]
              }
            }
          ]
        }
      },
      matchRoadLinkRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-matchRoadLinkRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-matchRoadLinkPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-reportRejectedDelta`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-getNearbyLinks`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['lambda:InvokeFunction'],
                    Resource: `arn:aws:lambda:eu-west-1:${process.env.AWS_ACCOUNT_ID}:function:DRKunta-${process.env.STAGE_NAME}-execDelta2SQL`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket', 's3:GetObject'],
                    Resource: [
                      `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/calculateDelta/*`,
                      `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/getNearbyLinks/*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:PutObject', 's3:PutObjectAcl'],
                    Resource: [
                      `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/matchRoadLink/*`,
                      `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/logs/*`
                    ]
                  }
                ]
              }
            }
          ]
        }
      },
      reportRejectedDeltaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: `DRKunta-${process.env.STAGE_NAME}-reportRejectedDeltaRole`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                },
                Action: 'sts:AssumeRole'
              }
            ]
          },
          ManagedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
          ],
          Policies: [
            {
              PolicyName: `DRKunta-${process.env.STAGE_NAME}-reportRejectedDeltaPolicy`,
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents'
                    ],
                    Resource: `arn:aws:logs:eu-west-1:${process.env.AWS_ACCOUNT_ID}:log-groups:/aws/lambda/*:*:*`
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:PutObject',
                      's3:PutObjectAcl',
                      's3:ListBucket',
                      's3:GetObject',
                      's3:DeleteObject'
                    ],
                    Resource: `arn:aws:s3:::dr-kunta-${process.env.STAGE_NAME}-bucket/*`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:DescribeParameters'],
                    Resource: [
                      `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:*`
                    ]
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter/${process.env.SMTP_USERNAME_SSM_KEY}`
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: `arn:aws:ssm:eu-west-1:${process.env.AWS_ACCOUNT_ID}:parameter/${process.env.SMTP_PASSWORD_SSM_KEY}`
                  }
                ]
              }
            }
          ]
        }
      }
    }
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10
    }
  }
};

module.exports = serverlessConfiguration;
