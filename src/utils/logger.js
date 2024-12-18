import winston from "winston";
import chalk from "chalk";
import "winston-daily-rotate-file";

const createTimestampFormat = () => {
    return winston.format((info) => {
        info.level = info.level.toUpperCase();
        info.timestamp = new Date().toLocaleTimeString();
        return info;
    });
};

const createConsoleFormat = () => {
    return winston.format.combine(
        createTimestampFormat()(),
        winston.format.colorize(),
        winston.format.printf((info) => {
            const timestamp = chalk.dim(`[${info.timestamp}]`);
            const message =
                typeof info.message === "string"
                    ? info.message
                    : JSON.stringify(info.message, null, 4);

            if (info instanceof Error) {
                return `${timestamp} ${info.level} ${info.message} ${info.stack}`;
            }
            return `${timestamp} ${info.level} ${message}`;
        }),
    );
};

const createFileFormat = () => {
    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(
            (info) =>
                `${info.timestamp} ${info.level.toUpperCase()} ${info.message}`,
        ),
    );
};

// Initialize logger with console and file transports
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: createConsoleFormat(),
        }),
        new winston.transports.DailyRotateFile({
            dirname: "logs",
            filename: "%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
            zippedArchive: true,
            format: createFileFormat(),
        }),
    ],
});

// Override error method to better handle Error objects
logger.error = (err) => {
    const message = err instanceof Error ? err.stack || err : err;
    logger.log({ level: "error", message });
};

export default logger;
