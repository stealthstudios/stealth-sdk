import winston from "winston";
import chalk from "chalk";
import "winston-daily-rotate-file";

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: winston.format.combine(
                winston.format((info) => {
                    const date = new Date();
                    info.level = info.level.toUpperCase();
                    info.timestamp = date.toLocaleTimeString();
                    return info;
                })(),
                winston.format.colorize(),
                winston.format.printf(function (info) {
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
            ),
        }),
        new winston.transports.DailyRotateFile({
            filename: "%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            dirname: "logs",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
                winston.format.printf((info) => {
                    return `${info.timestamp} ${info.level.toUpperCase()} ${info.message}`;
                }),
            ),
        }),
    ],
});

// yeah dont ask me why this is needed, thanks winston!
logger.error = (err) => {
    if (err instanceof Error) {
        logger.log({ level: "error", message: `${err.stack || err}` });
    } else {
        logger.log({ level: "error", message: err });
    }
};

export default logger;
