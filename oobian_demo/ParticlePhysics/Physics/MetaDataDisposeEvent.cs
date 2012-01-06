using System;
using System.Collections.Generic;
using System.Text;
using SharpKit.JavaScript;

namespace Physics
{
    [JsType(JsMode.Prototype, Filename = "PhysicsMetadata.js")]
    public class PhysicsMetadata
    {
    }

    [JsType(JsMode.Clr, Filename="MetaDataDisposeHandlers.js")]
    public delegate void MetaDataDisposeHandler(object sender,MetaDataDisposeEventArgs metaData);

    [JsType(JsMode.Prototype, Filename="MetaDataDisposeEventArgs.js")]
    public class MetaDataDisposeEventArgs: EventArgs
    {
        private PhysicsMetadata _metaData;

        public MetaDataDisposeEventArgs(PhysicsMetadata metaData)
        {
            _metaData = metaData;
        }

        public PhysicsMetadata MetaData
        {
            get { return _metaData; }
            set { _metaData = value; }
        }
    }
}
