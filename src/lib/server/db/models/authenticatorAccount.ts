import mongoose from 'mongoose';
import type { Document } from 'mongoose';
const { Schema, model } = mongoose;

export interface IAuthenticatorAccount extends Document {
    username: string;
    secret: string;
    permissionLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

const AuthenticatorAccountSchema = new Schema({
	username: { type: String, required: true, unique: true },
	secret: { type: String, required: true },
	permissionLevel: { type: Number, required: true, default: 1 },
}, {
	timestamps: true
});

interface AuthenticatorAccountModel extends mongoose.Model<IAuthenticatorAccount> {
    findByUsername(username: string): Promise<IAuthenticatorAccount | null>;
}

export const AuthenticatorAccount = model<IAuthenticatorAccount, AuthenticatorAccountModel>('AuthenticatorAccount', AuthenticatorAccountSchema);