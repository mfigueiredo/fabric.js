using System;
using System.Collections.Generic;
using System.Text;
using System.Collections;
using SharpKit.JavaScript;

[JsType(JsMode.Clr, Filename="ForceDissipationDelegate.js")]
public delegate double ForceDissipationDelegate(double distance);

namespace Physics
{
    [JsType(JsMode.Clr, Filename = "Particle.js")]
    public class Particle
    {
        /// <summary>
        /// an event that allows metadata for all connectors directly connected to this particle to be disposed when the connector is removed
        /// </summary>
        public event MetaDataDisposeHandler DisposeConnectorMetaData;

        private double _invmass;
        private double _mass, _restingForce;
        private Vector _previousPosition, _position;
        private Vector _accumulatedForces;
        private ArrayList _connectors;
        private ForceDissipationDelegate _forceDissipationFunction;
        private ParticleMetadata _metaData;

        public ParticleMetadata MetaData
        {
            get { return _metaData; }
            set { _metaData = value;}
        }

        public double RestingForce
        {
            get { return _restingForce; }
            set { _restingForce = value; }
        }

        public double Mass
        {
            get { return _mass; }
            set { _mass = value; }
        }

        public Vector Position
        {
            get { return _position; }
            set { _position = value; }
        }

        public Vector PreviousPosition
        {
            get { return _previousPosition; }
            set { _previousPosition = value; }
        }

        public double InvMass
        {
            get { return _invmass; }
            set { _invmass = value; }
        }

        public Vector AccumulatedForces
        {
            get { return _accumulatedForces; }
            set { _accumulatedForces = value; }
        }

        public ArrayList Connectors
        {
            get { return _connectors; }
        }

        /// <summary>
        /// creates a particle
        /// </summary>
        /// <param name="mass">the mass of the particle</param>
        /// <param name="restingForce">the force emitted by the particle on other particles</param>
        /// <param name="forceDissipationFunction">the function that dissipates force with distance</param>
        public Particle(double mass, double restingForce,ForceDissipationDelegate forceDissipationFunction) 
        {
            _mass = mass;
            _invmass = 1/mass;
            _restingForce = restingForce;
            _forceDissipationFunction = forceDissipationFunction;

            _connectors = new ArrayList();

            _previousPosition = new Vector(0,0);
            _position = new Vector(0,0);
            _accumulatedForces = new Vector(0,0);
        }

        /// <summary>
        /// Add a connection between two particles
        /// </summary>
        /// <param name="p">the particle to connect to this one</param>
        /// <param name="restingLength">the resting length of the connection (when no spring tension forces are applied to the connected particles)</param>
        /// <param name="springConstant">the spring constant of the connector denoting the strength of the connectors tensile force on the connected particles</param>
        public void AddConnection(Particle p, ConnectorMetadata connectorMetaData,double restingLength,double springConstant) 
        {
            //if a connection to/from this particle already exists then don't add it again.
            foreach (ParticleConnector connector in Connectors)
            {
                if (connector.Particle1 == p || connector.Particle2 == p)
                {
                    return;
                }
            }

            ParticleConnector pc = new ParticleConnector(this, p, restingLength, springConstant);
            pc.MetaData = connectorMetaData;
            //add the connector to both particles
            AddConnector(pc);
            p.AddConnector(pc);
        }

        /// <summary>
        /// remove the connection between two particles (does nothing if the particles aren't connected)
        /// and fires the metadatadispose event for this particle
        /// </summary>
        /// <param name="p">the particle that this particle is connected to</param>
        public void RemoveConnection(Particle p) 
        {

            foreach (ParticleConnector connector in Connectors)
            {
                //if the particle is a child of the current particle
                if (connector.Particle2 == p || connector.Particle1 == p)
                {
                    RemoveConnector(connector);
                    p.RemoveConnector(connector);
                    if (DisposeConnectorMetaData != null)
                    {
                        DisposeConnectorMetaData(this, new MetaDataDisposeEventArgs(connector.MetaData));
                    }
                    break;
                }
            }
        }

        protected void AddConnector(ParticleConnector pc)
        {
            Connectors.Add(pc);
        }

        protected void RemoveConnector(ParticleConnector pc)
        {
            Connectors.Remove(pc);
        }

        /// <summary>
        /// remove all connections to and from this particle
        /// </summary>
        public void DisconnectParticle()
        {
            for (int i = _connectors.Count - 1; i >= 0;--i)
            {
                if (((ParticleConnector)_connectors[i]).Particle1 != this)
                {
                    ((ParticleConnector)_connectors[i]).Particle1.RemoveConnector((ParticleConnector)_connectors[i]);
                }
                else
                {
                    ((ParticleConnector)_connectors[i]).Particle2.RemoveConnector((ParticleConnector)_connectors[i]);
                }
                if (DisposeConnectorMetaData != null)
                {
                    DisposeConnectorMetaData(this, new MetaDataDisposeEventArgs(((ParticleConnector)_connectors[i]).MetaData));
                }
                RemoveConnector((ParticleConnector)_connectors[i]);
            }
        }

        /// <summary>
        /// Find the sum of the forces acting on this particle from all its connectors
        /// </summary>
        public Vector AccumulateConnectorForces()
        {
            Vector v = new Vector(0,0);
            foreach (ParticleConnector connector in Connectors)
            {
                if (IsInwardConnection(connector))
                {
                    v += connector.ForceOnParticle2();
                }
                else
                {
                    v += connector.ForceOnParticle1();                   
                }
            }
            return v;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="position">the position being queried for the strength of the resting force</param>
        /// <returns>the resting force exerted at the position specified</returns>
        public Vector RestingForceAtPosition(Vector position)
        {
            Vector v = _position - position;
            double forceScalar = _restingForce * _forceDissipationFunction(Vector.Length(v));
            if (v.X != 0 || v.Y != 0)
            {
                Vector.Normalize(ref v);
            }
            else
            {
                Random r = new Random(DateTime.Now.Millisecond);
                double value = r.NextDouble();
                v = new Vector(value,1-value);
            }
            Vector.MultiplyLength(ref v,forceScalar*-1);
            return v;
        }

        /// <summary>
        /// set the length of all connections which connect into this particle
        /// </summary>
        /// <param name="length">the new resting length of the connection</param>
        public void SetInwardConnectorLengths(double length)
        {
            foreach (ParticleConnector connector in Connectors)
            {
                if (IsInwardConnection(connector))
                {
                    connector.RestingLength = length;
                }    
            }
        }

        /// <summary>
        /// set the length of all connections which connect out of this particle
        /// </summary>
        /// <param name="length">the new resting length of the connection</param>
        public void SetOutwardConnectorLengths(double length)
        {
            foreach (ParticleConnector connector in Connectors)
            {
                if (IsOutwardConnection(connector))
                {
                    connector.RestingLength = length;
                }
            }
        }

        private bool IsInwardConnection(ParticleConnector p)
        {
            //particle1 represents the origin of the connection, so if this is particle 2 then it must come in from particle1
            return p.Particle2 == this;
        }

        private bool IsOutwardConnection(ParticleConnector p)
        {
            //particle2 represents the endpoint of the connection, so if this is particle1 then it must go out toward particle2
            return p.Particle1 == this;
        }

        public void InitPosition(double x, double y)
        {
            Position = new Vector(x,y);
            PreviousPosition = Position.Clone();
        }
    }
}
