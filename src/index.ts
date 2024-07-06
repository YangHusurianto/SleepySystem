// https://www.youtube.com/watch?v=4IxLBKPVyXE
require("dotenv").config();
import { ExtendedClient } from './structures/Client';

export const client = new ExtendedClient();

client.start();