import bcrypt from 'bcryptjs';
import type { Document } from 'mongoose';
import mongoose, { Types } from 'mongoose';
const { Schema, model } = mongoose;

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  passwordHash: string; //we don't store actual password
  permissionLevel: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
	username: { type: String, required: true, unique: true },
	passwordHash: { type: String, required: true },
	permissionLevel: { type: Number, required: true, default: 1 },
}, {
	timestamps: true
});

UserSchema.pre('save', async function() {
	const user = this as unknown as IUser;
  
	if (!user.isModified('passwordHash')) {
		return;
	}
  
	//Generate salt and hash
	const salt = await bcrypt.genSalt(10);
	user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
});

//Method to compare given password with stored hash
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
	return bcrypt.compare(candidatePassword, this.passwordHash);
};

interface UserModel extends mongoose.Model<IUser> {
  findByUsername(username: string): Promise<IUser | null>;
}

const User = mongoose.models.User || model<IUser, UserModel>('User', UserSchema);

export default User;
