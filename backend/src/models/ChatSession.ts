// src/models/ChatSession.ts
import mongoose, { Schema, Model, Types, Document } from "mongoose";
import { IChatMessage, MessageType } from "../types";

// ChatSession interface for the model
interface IChatSessionDocument extends Document {
  user: Types.ObjectId;
  title?: string;
  messages: IChatMessage[];
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  duration: number;
  formattedDuration: string;
  messageSummary: {
    total: number;
    user: number;
    ai: number;
  };

  // Instance methods
  addUserMessage(content: string): Promise<IChatSessionDocument>;
  addAIMessage(
    content: string,
    searchResults?: Types.ObjectId[],
    metadata?: any
  ): Promise<IChatSessionDocument>;
  getRecentMessages(limit?: number): IChatMessage[];
  getMessageCount(): number;
  getUserMessageCount(): number;
  getAIMessageCount(): number;
  archive(): Promise<IChatSessionDocument>;
  reactivate(): Promise<IChatSessionDocument>;
  clearMessages(): Promise<IChatSessionDocument>;
}

// Chat message sub-schema
const chatMessageSchema = new Schema<IChatMessage>(
  {
    type: {
      type: String,
      required: [true, "Message type is required"],
      enum: {
        values: ["user", "ai"] as MessageType[],
        message: 'Message type must be either "user" or "ai"',
      },
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      minlength: [1, "Message content cannot be empty"],
      maxlength: [5000, "Message content cannot exceed 5000 characters"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    searchResults: {
      type: [Schema.Types.ObjectId],
      ref: "Property",
      default: [],
    },
    metadata: {
      searchQuery: {
        type: String,
        trim: true,
      },
      filters: {
        type: Schema.Types.Mixed,
        default: null,
      },
      resultCount: {
        type: Number,
        min: [0, "Result count cannot be negative"],
        default: 0,
      },
    },
  },
  { _id: true }
);

// Chat session schema definition
const chatSessionSchema = new Schema<IChatSessionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: function () {
        return `Chat Session - ${new Date().toLocaleDateString()}`;
      },
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
      validate: {
        validator: function (messages: IChatMessage[]) {
          return messages.length <= 1000;
        },
        message: "Cannot have more than 1000 messages per session",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
chatSessionSchema.index({ user: 1 });
chatSessionSchema.index({ isActive: 1 });
chatSessionSchema.index({ lastActivity: -1 });
chatSessionSchema.index({ user: 1, isActive: 1 });
chatSessionSchema.index({ user: 1, lastActivity: -1 });

// Pre-save middleware to update lastActivity
chatSessionSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.lastActivity = new Date();
  }
  next();
});

// Instance methods
chatSessionSchema.methods.addUserMessage = function (content: string) {
  const message = {
    type: "user" as MessageType,
    content: content.trim(),
    timestamp: new Date(),
    searchResults: [],
    metadata: {},
  };

  this.messages.push(message);
  this.lastActivity = new Date();
  return this.save();
};

chatSessionSchema.methods.addAIMessage = function (
  content: string,
  searchResults: Types.ObjectId[] = [],
  metadata: any = {}
) {
  const message = {
    type: "ai" as MessageType,
    content: content.trim(),
    timestamp: new Date(),
    searchResults,
    metadata: {
      ...metadata,
      resultCount: searchResults.length,
    },
  };

  this.messages.push(message);
  this.lastActivity = new Date();
  return this.save();
};

chatSessionSchema.methods.getRecentMessages = function (
  limit: number = 10
): IChatMessage[] {
  return this.messages.slice(-limit);
};

chatSessionSchema.methods.getMessageCount = function (): number {
  return this.messages.length;
};

chatSessionSchema.methods.getUserMessageCount = function (): number {
  return this.messages.filter((msg: IChatMessage) => msg.type === "user")
    .length;
};

chatSessionSchema.methods.getAIMessageCount = function (): number {
  return this.messages.filter((msg: IChatMessage) => msg.type === "ai").length;
};

chatSessionSchema.methods.archive = function () {
  this.isActive = false;
  return this.save();
};

chatSessionSchema.methods.reactivate = function () {
  this.isActive = true;
  this.lastActivity = new Date();
  return this.save();
};

chatSessionSchema.methods.clearMessages = function () {
  this.messages = [];
  this.lastActivity = new Date();
  return this.save();
};

// Static methods
chatSessionSchema.statics.findActiveByUser = function (userId: Types.ObjectId) {
  return this.find({ user: userId, isActive: true }).sort({ lastActivity: -1 });
};

chatSessionSchema.statics.findRecentByUser = function (
  userId: Types.ObjectId,
  limit: number = 10
) {
  return this.find({ user: userId }).sort({ lastActivity: -1 }).limit(limit);
};

chatSessionSchema.statics.cleanupOldSessions = function (daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    isActive: false,
    lastActivity: { $lt: cutoffDate },
  });
};

chatSessionSchema.statics.getUserStats = function (userId: Types.ObjectId) {
  return this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$user",
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: ["$isActive", 1, 0] },
        },
        totalMessages: {
          $sum: { $size: "$messages" },
        },
        lastActivity: { $max: "$lastActivity" },
      },
    },
  ]);
};

// Virtual for session duration
chatSessionSchema
  .virtual("duration")
  .get(function (this: IChatSessionDocument) {
    if (this.messages.length < 2) return 0;

    const firstMessage = this.messages[0];
    const lastMessage = this.messages[this.messages.length - 1];

    return lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
  });

// Virtual for formatted duration
chatSessionSchema
  .virtual("formattedDuration")
  .get(function (this: IChatSessionDocument) {
    const duration = this.duration;
    if (duration === 0) return "0 minutes";

    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  });

// Virtual for message summary
chatSessionSchema
  .virtual("messageSummary")
  .get(function (this: IChatSessionDocument) {
    const userMessages = this.getUserMessageCount();
    const aiMessages = this.getAIMessageCount();
    return {
      total: this.messages.length,
      user: userMessages,
      ai: aiMessages,
    };
  });

// Create and export the model
const ChatSession: Model<IChatSessionDocument> =
  mongoose.model<IChatSessionDocument>("ChatSession", chatSessionSchema);

export { ChatSession };
export default ChatSession;
export type { IChatSessionDocument };
