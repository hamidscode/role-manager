import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export type PermissionDocument = Permission & Document;
export const PermissionSchema = SchemaFactory.createForClass(Permission);
