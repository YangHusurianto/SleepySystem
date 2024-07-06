// https://www.youtube.com/watch?v=4IxLBKPVyXE
import 'dotenv/config';
import { ExtendedClient } from './structures/Client.ts';

export const client = new ExtendedClient();

client.start();