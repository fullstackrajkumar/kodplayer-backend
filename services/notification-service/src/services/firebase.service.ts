import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";
import { FIREBASE_SERVICE_ACCOUNT_JSON } from "../constants/app.constant";
import { parseFirebaseServiceAccount } from "../utils/firebase-credentials.util";

export interface FcmSendInput {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  onModuleInit(): void {
    if (!FIREBASE_SERVICE_ACCOUNT_JSON.trim()) {
      this.logger.warn(
        "FIREBASE_SERVICE_ACCOUNT_JSON not set — push delivery disabled (history/queue still work)",
      );
      return;
    }
    try {
      const credentials = parseFirebaseServiceAccount(FIREBASE_SERVICE_ACCOUNT_JSON);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(credentials) });
      }
      this.initialized = true;
      this.logger.log("Firebase Admin initialized");
    } catch (err) {
      this.logger.error("Failed to initialize Firebase Admin", err);
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  async sendMulticast(input: FcmSendInput): Promise<FcmSendResult> {
    const tokens = [...new Set(input.tokens.map((t) => t.trim()).filter(Boolean))];
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }
    if (!this.initialized) {
      this.logger.warn(`Skipping FCM send (${tokens.length} tokens) — Firebase not configured`);
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    // Navigation + type in `data` only — do not duplicate title/body here or Android
    // shows two notifications (system tray from `notification` + app local from `data`).
    const data: Record<string, string> = { ...(input.data ?? {}) };

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: input.title, body: input.body },
      data,
      android: { priority: "high" },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code ?? "";
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        invalidTokens.push(tokens[i]!);
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  }
}
