import pusher from 'pusher-js';
import { ENVIRONMENT, PUSHER_APP_KEY, PUSHER_APP_CLUSTER } from '../const';

const PUSHER_ENABLED_ENVIRONMENTS = ["LIVE", "STAGE"]
let PUSHER_APP = null;

const getPusherApp = () => {
    console.log("PUSHER_APP: ", PUSHER_APP);
    if (PUSHER_ENABLED_ENVIRONMENTS.includes(ENVIRONMENT) && !PUSHER_APP){
        try{
            PUSHER_APP = new pusher(PUSHER_APP_KEY, {
                cluster: PUSHER_APP_CLUSTER,
                forceTLS: true,
            });
        }catch{
            console.log("Failed to create pusher app.")
            PUSHER_APP = null;
        }
    }
    console.log("PUSHER_APP: ", PUSHER_APP);
    return PUSHER_APP;
}

const subscribeChannel = (pusher_app, channel_name) => {
    if (!pusher_app){
        return null;
    }

    let channel = pusher_app.channel(channel_name);
    if(!channel){
        try{
            channel = pusher_app.subscribe(channel_name);
        }catch{
            console.log("Failed to subscribe channel.")
        }
    }

    return channel;
}


export {getPusherApp, subscribeChannel};
