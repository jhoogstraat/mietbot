import { Queue } from "bullmq"
import { AnyBulkWriteOperation, Db, MongoClient } from "mongodb"
import { stringify } from "querystring"
import { Appartment, ProviderName } from "../appartment_type"

export default class Database {
    db: Db

    private constructor(db: Db) {
        this.db = db
    }

    static async init(): Promise<Database> {
        const user = process.env.MONGO_USER!
        const pass = process.env.MONGO_PASS!
        const client = await MongoClient.connect(`mongodb://127.0.0.1:27017`, { auth: { username: user, password: pass }, authSource: "admin" })
        const db = client.db("mietbot")

        await db.collection('listings').createIndex(['provider', 'appartmentId'], { unique: true })

        return new Database(db)
    }

    async update(appartments: Appartment[]): Promise<void> {
        await this.db.collection('listings').insertMany(appartments)
    }

    async addSubscription(id: string): Promise<void> {
        await this.db.collection('channels').insertOne({ id })
    }

    async removeSubscription(id: string): Promise<void> {
        await this.db.collection('channels').deleteOne({ id })
    }

    getSubscriptions(): Promise<string[]> {
        return this.db.collection('channels').distinct('id')
    }
}