import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from "@nestjs/terminus";

@Controller()
export class ProbesController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  root(): { status: string } {
    return { status: "ok" };
  }

  @Get("health")
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", 512 * 1024 * 1024),
    ]);
  }

  @Get("startUpProbe")
  @HealthCheck()
  startUpProbe() {
    return this.health.check([]);
  }

  @Get("livenessProbe")
  @HealthCheck()
  livenessProbe() {
    return this.health.check([]);
  }

  @Get("readinessProbe")
  @HealthCheck()
  readinessProbe() {
    return this.health.check([]);
  }
}
