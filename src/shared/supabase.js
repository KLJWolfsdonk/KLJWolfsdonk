import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { appConfig } from "./config.js";

export const supabase = createClient(
    appConfig.supabaseUrl,
    appConfig.supabaseKey
);