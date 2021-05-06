import mongoose from 'mongoose'
const WhatsAppSchema =mongoose.Schema({
    message: String,
    sender:mongoose.Schema.Types.ObjectId,
    recipient:mongoose.Schema.Types.ObjectId,
    timestamp: Boolean,
    recieved: Boolean,
})
export default mongoose.model('messagecontent',WhatsAppSchema)