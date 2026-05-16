import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
    default: null
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  },
  // Telegram-specific fields
  telegramId: {
    type: Number,
    unique: true,
    sparse: true,  // allows multiple null values
    default: null
  },
  telegramUsername: {
    type: String,
    trim: true,
    default: null
  },
  firstName: {
    type: String,
    trim: true,
    default: null
  },
  lastName: {
    type: String,
    trim: true,
    default: null
  },
  photoUrl: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// REMOVE THE PRE-SAVE MIDDLEWARE COMPLETELY
// We'll handle password hashing manually in the routes/scripts

// Method to hash password (call this before saving)
userSchema.methods.hashPassword = async function() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;