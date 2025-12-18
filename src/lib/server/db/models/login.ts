import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface ILogin extends Document {
    _id: Types.ObjectId;
    login_id: string;
    name: string;
    is_google: boolean;
    permissionLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

const LoginSchema = new Schema({
	login_id: { type: String, required: true, unique: true },
	is_google: { type: Boolean, required: true, default: false },
    name: { type: String, required: false },
	permissionLevel: { type: Number, required: true, default: 1 },
}, {
	timestamps: true
});

interface LoginModel extends mongoose.Model<ILogin> {
    findByLoginId(login_id: string): Promise<ILogin | null>;
}

export const Login = model<ILogin, LoginModel>('Login', LoginSchema);