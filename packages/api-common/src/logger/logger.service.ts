import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class LoggerService {
  private readonly logger: Logger;
  private readonly defaultContext: string;

  constructor(context = "Application") {
    this.defaultContext = context;
    this.logger = new Logger(context);
  }

  log(message: string, context?: string): void {
    this.logger.log(message, context ?? this.defaultContext);
  }

  error(message: string, trace?: string): void {
    this.logger.error(message, trace ?? this.defaultContext);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context ?? this.defaultContext);
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, context ?? this.defaultContext);
  }

  child(context: string): LoggerService {
    return new LoggerService(context);
  }
}
