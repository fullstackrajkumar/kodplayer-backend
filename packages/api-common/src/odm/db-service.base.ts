import { Injectable } from "@nestjs/common";
import { FilterQuery, Model, QueryOptions, UpdateQuery } from "mongoose";
import { transformUuidQueryFilter } from "./plugins/uuid-query.plugin";

@Injectable()
export abstract class BaseDbService<T> {
  constructor(protected readonly model: Model<T>) {}

  protected castFilter(filter: FilterQuery<T>): FilterQuery<T> {
    const casted = { ...filter } as Record<string, unknown>;
    transformUuidQueryFilter(this.model.schema, casted);
    return casted as FilterQuery<T>;
  }

  async find(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    return this.model.find(this.castFilter(filter), null, options).lean().exec() as Promise<T[]>;
  }

  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    return this.model.findOne(this.castFilter(filter), null, options).lean().exec() as Promise<T | null>;
  }

  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    return this.model.findById(id, null, options).lean().exec() as Promise<T | null>;
  }

  async create(doc: Partial<T>): Promise<T> {
    const created = await this.model.create(doc);
    return created.toObject() as T;
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(this.castFilter(filter), update, { new: true })
      .lean()
      .exec() as Promise<T | null>;
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<number> {
    const res = await this.model.updateMany(this.castFilter(filter), update).exec();
    return res.modifiedCount ?? 0;
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.updateOne({ _id: id } as FilterQuery<T>, update);
  }

  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(this.castFilter(filter)).exec();
    return result.deletedCount === 1;
  }

  async deleteById(id: string): Promise<boolean> {
    return this.deleteOne({ _id: id } as FilterQuery<T>);
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(this.castFilter(filter)).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const r = await this.model.exists(this.castFilter(filter)).exec();
    return !!r;
  }
}
