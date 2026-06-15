import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { ProbesController } from "./probes.controller";

@Module({
  imports: [TerminusModule],
  controllers: [ProbesController],
})
export class ProbesModule {}
