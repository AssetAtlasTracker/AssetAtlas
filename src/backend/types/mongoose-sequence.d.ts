//we need this so that our import of mongoose sequence works. if we dont use mongoose
//sequence anymore we can get rid of this. mongoose sequence is used for auto increment
//on our item IDs
declare module 'mongoose-sequence' {
    //import mongoose from 'mongoose';
    function AutoIncrement(mongoose: typeof mongoose): unknown;
    export = AutoIncrement;
  }