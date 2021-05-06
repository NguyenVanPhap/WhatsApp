import mongoose from 'mongoose';
import bcrypt  from 'bcrypt';
const WhatsAppUserSchema =mongoose.Schema({
    name: String,
    email:{
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    communication:Array,
    timestamps: Boolean,
})
WhatsAppUserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        else{
            cb(null, isMatch);
        }
    });
};
export default mongoose.model('user',WhatsAppUserSchema)