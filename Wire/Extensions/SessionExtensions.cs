﻿using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Wire
{
    public static class SessionExtensions
    {
        public static void Set(this ISession session, string key, object value)
        {
            session.Set(key, JsonConvert.SerializeObject(value).ToBytes());
        }

        public static T Get<T>(this ISession session, string key)
        {
            byte[] bytes;

            var value = session.TryGetValue(key, out bytes);

            return value == false ? default(T) : JsonConvert.DeserializeObject<T>(bytes.FromBytes());
        }
    }
}
