import { BaseTimestamps, createSchema } from "../../schema.helper";
import { HydratedDocument, Model } from "mongoose";
import { uuidField } from "../../uuid-fields";

export const PHONE_OTP_CHALLENGE_MODEL_NAME = "PhoneOtpChallenge";

export const PhoneOtpChallengeSchema = createSchema(
  {
    /** Opaque challenge id returned to the client from `send-otp`; rotated on every send. */
    challengeId: uuidField({ unique: true, index: true }),
    /** E.164 normalized phone, one active challenge per phone. */
    phone: { type: String, required: true, unique: true, index: true },
    codeHash: { type: String, required: true },
    /** Unix epoch milliseconds. */
    expiresAt: { type: Number, required: true },
    /** Unix epoch milliseconds. */
    lastSentAt: { type: Number, required: true },
    /** Rolling window start (Unix epoch milliseconds) for send-OTP rate limit. */
    sendWindowStartedAt: { type: Number, required: true },
    /** Count of OTP sends within the current send window (max 5). */
    sendsInWindow: { type: Number, default: 0, min: 0 },
    /** Rolling window (Unix epoch milliseconds) for failed verify attempts. */
    verifyFailWindowStartedAt: { type: Number, required: true },
    verifyFailCount: { type: Number, default: 0, min: 0 },
    lastClientIp: { type: String, default: "" },
    lastDeviceToken: { type: String, default: "" },
  },
  { timestamps: true, collection: "phone_otp_challenges" },
);

export interface PhoneOtpChallenge extends BaseTimestamps {
  challengeId: string;
  phone: string;
  codeHash: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
  /** Unix epoch milliseconds. */
  lastSentAt: number;
  /** Unix epoch milliseconds. */
  sendWindowStartedAt: number;
  sendsInWindow: number;
  /** Unix epoch milliseconds. */
  verifyFailWindowStartedAt: number;
  verifyFailCount: number;
  lastClientIp: string;
  lastDeviceToken: string;
}

export type PhoneOtpChallengeDocument = HydratedDocument<PhoneOtpChallenge>;
export interface PhoneOtpChallengeModel extends Model<PhoneOtpChallengeDocument> {}
