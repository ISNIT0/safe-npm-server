import 'dotenv/config'
import * as convict from 'convict'

export enum Env {
    Test = 'test',
    Development = 'development',
    Production = 'production',
}

export enum LogLevel {
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
}

import { values as _values } from 'lodash';

const convictConfig = convict({
    app: {
        env: {
            doc: 'The current environment of the app',
            format: String,
            enum: _values(Env),
            default: Env.Development,
            env: 'NODE_ENV',
        },
        name: {
            doc: 'The name of the current server instance for handling loggers',
            format: String,
            default: 'Della API',
            env: 'API_NAME',
        },
        host: {
            doc: 'The host on which the server should run.',
            format: String,
            default: 'localhost',
            env: 'HOST',
        },
        port: {
            doc: 'The port on which the server should run.',
            format: 'port',
            default: 12180,
            env: 'PORT',
        },
        logLevel: {
            doc: 'Logging level, can be log, console, warn, error, info',
            format: String,
            enum: _values(LogLevel),
            default: LogLevel.Error,
            env: 'LOG_LEVEL',
        },
    },
    aws: {
        queueUrl: {
            doc: 'SQS Queue URL',
            format: String,
            default: null,
            env: 'AWS_SQS_QUEUE_URL',
        }
    },
    github: {
        token: {
            doc: 'GitHub user token',
            format: String,
            default: null,
            env: 'GITHUB_TOKEN'
        }
    },
    travis: {
        token: {
            doc: 'Travis API Token',
            format: String,
            default: null,
            env: 'TRAVISCI_TOKEN'
        }
    }
})

export { convictConfig }
