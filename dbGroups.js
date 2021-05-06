import mongoose from 'mongoose'
const WhatsAppGroupSchema =mongoose.Schema({
    member: Array,
    admin:mongoose.Schema.Types.ObjectId,
    name:String,
    code: {
        type: String,
        required: true,
        unique: true
    },
    timestamps: String,
})
export default mongoose.model('group',WhatsAppGroupSchema)