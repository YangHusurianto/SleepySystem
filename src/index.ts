// https://www.youtube.com/watch?v=4IxLBKPVyXE
// https://github.com/Rj1221/MongooseCheatsheet
import 'dotenv/config';
import { ExtendedClient } from './structures/Client.ts';

export const client = new ExtendedClient();

client.start();