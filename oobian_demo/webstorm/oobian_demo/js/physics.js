
if(typeof(physics) == "undefined")
    physics = {};

var physics = physics || { version: "0.1" };

if (typeof exports != 'undefined') {
    exports.physics = physics;
}

// namespace ForceDissipationFunction definition and registration
{
    // namespace ForceDissipationFunction registration
    physics.forceDissipationFunction = {};

    // InverseDistanceFunction class
    physics.forceDissipationFunction.InverseDistanceFunction = function (scaleFactor)
    {
        this._scaleFactor = scaleFactor;
    };

    physics.forceDissipationFunction.InverseDistanceFunction.prototype._scaleFactor = 0;

    /// <summary>
    /// creates an inverse distance dissipation function, this causes the force applied to decay asymptotically toward 0
    /// </summary>
    /// <param name="scaleFactor">Applies a linear scaling effect to the inverse distance decay rate (must NOT be 0)</param>
    physics.forceDissipationFunction.InverseDistanceFunction.prototype.GetForceAtDistance = function(distance)
    {
        if ((distance * this._scaleFactor) < 1)
        {
            return 1;
        }
        else
        {
            return 1 / (distance * this._scaleFactor);
        }
    };

    // LinearForceDissipationFunction class
    physics.forceDissipationFunction.LinearForceDissipationFunction = function(distanceOfNoEffect)
    {
        this._distanceOfNoEffect = distanceOfNoEffect;
    };

    physics.forceDissipationFunction.LinearForceDissipationFunction.prototype._distanceOfNoEffect = 0;

    /// creates a linear dissipation function, this causes forces to decay at a linear rate toward 0
    /// </summary>
    /// <param name="distanceOfNoEffect">the distance at which no force will be applied (must NOT be 0)</param>
    physics.forceDissipationFunction.LinearForceDissipationFunction.prototype.GetForceAtDistance = function(distance)
    {
        if (distance > this._distanceOfNoEffect)
        {
            return 0;
        }
        else
        {
            return (this._distanceOfNoEffect - distance) / this._distanceOfNoEffect;
        }
    }
}

// namespace Helper definition and registration
{
    physics.helper = {};
    physics.helper.AddElementToArray = function(array, element)
    {
        array.push(element);

        return array;
    };

    physics.helper.RemoveElementFromArray = function (array, element)
    {
        for(var i = 0; i < array.length; i++)
        {
            if (array[i] == element)
            {
                if (i == 0)
                {
                    array = array.shift();
                }
                else if (i == (array.length - 1))
                {
                    array = array.pop();
                }
                else
                {
                    var upperArray = array.splice(0, i);
                    var lowerArray = array.splice(i + 1);

                    var newArray = upperArray.concat(lowerArray);
                }

                return newArray;
            }
        }

        alert("element was not found in the array");
        return array;
    }
}

// Vector class definition and registration
{
    physics.Vector = function(x, y)
    {
        this._x = x;
        this._y = y;
    };

    physics.Vector.prototype.Clone = function()
    {
        return new physics.Vector(this.GetX(),this.GetY());
    };

    physics.Vector.prototype.GetY = function()
    {
        return this._y;
    };

    physics.Vector.prototype.SetY = function(value)
    {
        this._y = value;
    };

    physics.Vector.prototype.GetX = function()
    {
        return this._x;
    };

    physics.Vector.prototype.SetX = function(value)
    {
        this._x = value;
    };

    physics.Vector.Sum = function(a, b)
    {
        return new physics.Vector(a._x + b._x, a._y + b._y);
    };

    physics.Vector.Subtract = function(a, b)
    {
        return new physics.Vector(a._x - b._x, a._y - b._y);
    };

    physics.Vector.Length = function(a)
    {
        return Math.sqrt(Math.pow(a._x, 2) + Math.pow(a._y, 2));
    };

    physics.Vector.Normalize = function(a)
    {
        var invLength = 1 / physics.Vector.Length(a);
        a.SetX(a._x * invLength);
        a.SetY(a._y * invLength);

        return a;
    };

    physics.Vector.MultiplyLength = function(a, multiple)
    {
        a.SetX(a._x * multiple);
        a.SetY(a._y * multiple);

        return a;
    }
}

// Particle class definition and registration
{
    physics.Particle = function(mass, restingForce, forceDissipationFunction)
    {
        this._mass = mass;
        this._invmass = 1 / mass;
        this._restingForce = restingForce;
        this._forceDissipationFunction = forceDissipationFunction;
        this._connectors = new Array();
        this._position = new physics.Vector(0,0);
        this._previousPosition = new physics.Vector(0,0);
    };

    physics.Particle.prototype._connectors  = [];
    physics.Particle.prototype._previousPosition = new physics.Vector(0,0);
    physics.Particle.prototype._position = new physics.Vector(0,0);
    physics.Particle.prototype._accumulatedForces = new physics.Vector(0,0);
    physics.Particle.prototype._forceDissipationFunction = {};
    physics.Particle.prototype._doPhysics = true;

    // DisposeConnectorMetaData event
    {
        physics.Particle.prototype._onDisposeConnectorMetaData = new Array();

        physics.Particle.prototype.SubscribeOnDisposeConnectorMetaData = function(subscriber, eventHandler)
        {
            if (subscriber != null && eventHandler != null)
            {
                this._onDisposeConnectorMetaData.push([subscriber, eventHandler]);
            }
            else
            {
                throw "subscriber and/or eventHandler cannot be null";
            }
        };

        physics.Particle.prototype.UnSubscribeOnDisposeConnectorMetaData = function(subscriber)
        {
            for(var i = 0; i < this._onDisposeConnectorMetaData.length; i++)
            {
                if (this._onDisposeConnectorMetaData[i][0] == subscriber)
                {
                    if (i == 0)
                    {
                        this._onDisposeConnectorMetaData = this._onDisposeConnectorMetaData.shift();
                    }
                    else if (i == this._onDisposeConnectorMetaData.length)
                    {
                        this._onDisposeConnectorMetaData = this._onDisposeConnectorMetaData.pop();
                    }
                    else
                    {
                        var upperArray = this._onDisposeConnectorMetaData.splice(0, i);
                        var lowerArray = this._onDisposeConnectorMetaData.splice(i + 1);

                        this._onDisposeConnectorMetaData = upperArray.concat(lowerArray);
                    }

                    return;
                }
            }
        };

        physics.Particle.prototype.OnDisposeConnectorMetaData = function(source, connectorMetaData)
        {
            for(var i in this._onDisposeConnectorMetaData)
            {
                var subscriberHandler = this._onDisposeConnectorMetaData[i];
                try
                {
                    subscriberHandler[i][1].call(subscriberHandler[i][0], source, connectorMetaData);
                }
                catch(error)
                {
                    alert("error while calling" + subscriberHandler[i][1] + "on " + subscriberHandler[i][0] + " , error: " + error);
                }
            }
        };
    }

    //register geters/seters
    {
        physics.Particle.prototype.GetMetaData = function()
        {
            return this._metaData;
        };

        physics.Particle.prototype.SetMetaData = function(metadata)
        {
            this._metaData = metadata;
        };

        physics.Particle.prototype.GetRestingForce = function()
        {
            return this._restingForce;
        };

        physics.Particle.prototype.SetRestingForce = function(restingForce)
        {
            this._restingForce = restingForce;
        };

        physics.Particle.prototype.GetForceDissipationFunction = function()
        {
            return this._forceDissipationFunction;
        };

        physics.Particle.prototype.SetForceDissipationFunction = function(forceDissipationFunction)
        {
            this._forceDissipationFunction = forceDissipationFunction;
        };

        physics.Particle.prototype.GetMass = function()
        {
            return this._mass;
        };

        physics.Particle.prototype.SetMass = function(mass)
        {
            this._mass = mass;
            this._invmass = 1 / mass;
        };

        physics.Particle.prototype.GetPosition = function()
        {
            return this._position;
        };

        physics.Particle.prototype.SetPosition = function(position)
        {
            this._position = position;
        };

        physics.Particle.prototype.GetPreviousPosition = function()
        {
            return this._previousPosition;
        };

        physics.Particle.prototype.SetPreviousPosition = function(previousPosition)
        {
            this._previousPosition = previousPosition;
        };

        physics.Particle.prototype.GetInvMass = function()
        {
            return this._invmass;
        };

        physics.Particle.prototype.SetInvMass = function(invMass)
        {
            this._invmass = invMass;
            this._mass = 1 / invMass;
        };

        physics.Particle.prototype.GetAccumulatedForces = function()
        {
            return this._accumulatedForces;
        };

        physics.Particle.prototype.SetAccumulatedForces = function(accumulatedForces)
        {
            this._accumulatedForces = accumulatedForces;
        };

        physics.Particle.prototype.GetConnectors = function()
        {
            return this._connectors;
        };

        physics.Particle.prototype.SetConnectors = function(connectors)
        {
            this._connectors = connectors;
        };
    }


    physics.Particle.prototype.SetDoPhysics = function (doPhysics)
    {
        this._doPhysics = doPhysics;
    };

    physics.Particle.prototype.GetDoPhysics = function ()
    {
        return this._doPhysics;
    };

    /// <summary>
    /// Add a connection between two particles
    /// </summary>
    /// <param name="p">the particle to connect to this one</param>
    /// <param name="restingLength">the resting length of the connection (when no spring tension forces are applied to the connected particles)</param>
    /// <param name="springConstant">the spring constant of the connector denoting the strength of the connectors tensile force on the connected particles</param>
    physics.Particle.prototype.AddConnection = function(particle, connectorMetadata, restingLength, springConstant)
    {
        for(var i in this.GetConnectors())
        {
            var connector = this.GetConnectors()[i];
            if (connector.GetParticle1() == particle || connector.GetParticle2() == particle)
            {
                return;
            }
        }

        var newConnector = new physics.ParticleConnector(this, particle, restingLength, springConstant);
        newConnector.SetMetaData(connectorMetadata);
        //add the connector to both particles
        this.AddConnector(newConnector);
        particle.AddConnector(newConnector);
    };

    /// <summary>
    /// remove the connection between two particles (does nothing if the particles aren't connected)
    /// and fires the metadatadispose event for this particle
    /// </summary>
    /// <param name="p">the particle that this particle is connected to</param>
    physics.Particle.prototype.RemoveConnection = function(particle)
    {
        for(var i in this.GetConnectors())
        {
            var connector = this.GetConnectors()[i];

            //if the particle is a child of the current particle
            if (connector.GetParticle2() == particle || connector.GetParticle1() == particle)
            {
                this.RemoveConnector(connector);
                particle.RemoveConnector(connector);

                this.OnDisposeConnectorMetaData(this, connector.GetMetaData());
                return;
            }
        }
    };

    physics.Particle.prototype.AddConnector = function(connector)
    {
        this.SetConnectors(physics.helper.AddElementToArray(this.GetConnectors(), connector));
    };

    physics.Particle.prototype.RemoveConnector = function(connector)
    {
        this.SetConnectors(physics.helper.RemoveElementFromArray(this.GetConnectors(), connector));
    };

    /// <summary>
    /// remove all connections to and from this particle
    /// </summary>
    physics.Particle.prototype.DisconnectParticle = function()
    {
        for (var i = this._connectors.length - 1; i >= 0; --i)
        {
            if (this._connectors[i].GetParticle1() != this)
            {
                this._connectors[i].GetParticle1().RemoveConnector(this._connectors[i]);
            }
            else
            {
                this._connectors[i].GetParticle2().RemoveConnector(this._connectors[i]);
            }

            this.OnDisposeConnectorMetaData(this, this._connectors[i].GetMetaData());
            this.RemoveConnector(this._connectors[i]);
        }
    };

    /// <summary>
    /// Find the sum of the forces acting on this particle from all its connectors
    /// </summary>
    physics.Particle.prototype.AccumulateConnectorForces = function()
    {
        var forces = new physics.Vector(0, 0);
        for(var i in this.GetConnectors())
        {
            var connector = this.GetConnectors()[i];

            if (this.IsInwardConnection(connector))
            {
                forces = physics.Vector.Sum(forces, connector.ForceOnParticle2());
            }
            else
            {
                forces = physics.Vector.Sum(forces, connector.ForceOnParticle1());
            }
        }

        return forces;
    };

    /// <summary>
    ///
    /// </summary>
    /// <param name="position">the position being queried for the strength of the resting force</param>
    /// <returns>the resting force exerted at the position specified</returns>
    physics.Particle.prototype.RestingForceAtPosition = function(position)
    {
        var restingForce = physics.Vector.Subtract(this.GetPosition(), position);
        var forceScalar = this.GetRestingForce() * this.GetForceDissipationFunction().GetForceAtDistance(physics.Vector.Length(restingForce));

        if (restingForce.GetX() != 0 || restingForce.GetY() != 0)
        {
            restingForce = physics.Vector.Normalize(restingForce);
        }
        else
        {
            var randomValue = Math.random();
            restingForce = new physics.Vector(randomValue, 1 - randomValue);
        }

        restingForce = physics.Vector.MultiplyLength(restingForce, forceScalar * -1);

        return restingForce;
    };

    /// <summary>
    /// set the length of all connections which connect into this particle
    /// </summary>
    /// <param name="length">the new resting length of the connection</param>
    physics.Particle.prototype.SetInwardConnectorLengths = function(length)
    {
        for(var i in this.GetConnectors())
        {
            var connector = this.GetConnectors()[i];

            if (this.IsInwardConnection(connector))
            {
                connector.SetRestingLength(length);
            }
        }
    };

    /// <summary>
    /// set the length of all connections which connect out of this particle
    /// </summary>
    /// <param name="length">the new resting length of the connection</param>
    physics.Particle.prototype.SetOutwardConnectorLengths = function(length)
    {
        for(var i in this.GetConnectors())
        {
            var connector = this.GetConnectors()[i];

            if (this.IsOutwardConnection(connector))
            {
                connector.SetRestingLength(length);
            }
        }
    };

    physics.Particle.prototype.IsInwardConnection = function(connector)
    {
        //particle1 represents the origin of the connection, so if this is particle 2 then it must come in from particle1
        return (connector.GetParticle2() == this);
    };

    physics.Particle.prototype.IsOutwardConnection = function(connector)
    {
        //particle2 represents the endpoint of the connection, so if this is particle1 then it must go out toward particle2
        return (connector.GetParticle1() == this);
    };

    physics.Particle.prototype.InitPosition = function(x, y)
    {
        this.SetPosition(new physics.Vector(x, y));
        this._previousPosition = this.GetPosition().Clone();
    }
}

// ParticleConnector class definition and registration
{
    physics.ParticleConnector = function(particle1, particle2, restinglength, springConstant)
    {
        this._particle1 = particle1;
        this._particle2 = particle2;
        this._restingLength = restinglength;
        this._springConstant = springConstant;
    };

    physics.ParticleConnector.prototype._particle1 = null;
    physics.ParticleConnector.prototype._particle2 = null;
    physics.ParticleConnector.prototype._restingLength = 1;
    physics.ParticleConnector.prototype._springConstant = null;
    physics.ParticleConnector.prototype._metaData  = null;

    //register geters/seters
    {
        physics.ParticleConnector.prototype.GetParticle1 = function()
        {
            return this._particle1;
        };

        physics.ParticleConnector.prototype.SetParticle1 = function(particle)
        {
            this._particle1 = particle;
        };

        physics.ParticleConnector.prototype.GetParticle2 = function()
        {
            return this._particle2;
        };

        physics.ParticleConnector.prototype.SetParticle2 = function(particle)
        {
            this._particle2 = particle;
        };

        physics.ParticleConnector.prototype.GetRestingLength = function()
        {
            return this._restingLength;
        };

        physics.ParticleConnector.prototype.SetRestingLength = function(restingLength)
        {
            this._restingLength = restingLength;
        };

        physics.ParticleConnector.prototype.GetSpringConstant = function()
        {
            return this._springConstant;
        };

        physics.ParticleConnector.prototype.SetSpringConstant = function(springConstant)
        {
            this._springConstant = springConstant;
        };

        physics.ParticleConnector.prototype.GetMetaData = function()
        {
            return this._metaData;
        };

        physics.ParticleConnector.prototype.SetMetaData = function(metadata)
        {
            this._metaData = metadata;
        }
    }

    /// <summary>
    /// calculate the force applied by the spring to one of its connected particles at a point in time
    /// </summary>
    /// <returns>the force applied by the spring to one of its connected particles at a point in time</returns>
    physics.ParticleConnector.prototype.ForceOnParticle1 = function()
    {
        var force = physics.Vector.Subtract(this._particle1.GetPosition(), this._particle2.GetPosition());
        var forceLength = physics.Vector.Length(force);

        if (force.GetX() != 0 || force.GetY() != 0)
        {
            force = physics.Vector.Normalize(force);
        }
        else
        {
            var randomValue = Math.random();
            force = new physics.Vector(randomValue, 1 - randomValue);
        }

        force = physics.Vector.MultiplyLength(force, (forceLength - this.GetRestingLength()) * this.GetSpringConstant() * -1);

        return force;
    };

    /// <summary>
    /// calculate the force applied by the spring to one of its connected particles at a point in time
    /// </summary>
    /// <returns>the force applied by the spring to one of its connected particles at a point in time</returns>
    physics.ParticleConnector.prototype.ForceOnParticle2 = function()
    {
        var force = this.ForceOnParticle1();
        force = physics.Vector.MultiplyLength(force, -1);

        return force;
    }
}

// ParticleSimulation class definition and registration
{
    physics.ParticleSimulation = function(
        top, left, width, height,
        gravity, frictionConstant, staticFriction,
        connectionLength, connectionSpringConstant, forceDissipationFunction)
    {
        this._top = top;
        this._left = left;
        this._width = width;
        this._height = height;
        this._gravity = gravity;
        this._frictionConstant = frictionConstant;
        this._staticFriction = staticFriction;
        this._connectionLength = connectionLength;
        this._connectionSpringConstant = connectionSpringConstant;
        this._forceDissipationFunction = forceDissipationFunction;
        this._particles = new Array();
    };

    physics.ParticleSimulation.prototype._gravity = 1;
    physics.ParticleSimulation.prototype._frictionConstant = 1;
    physics.ParticleSimulation.prototype._staticFriction = 1;
    physics.ParticleSimulation.prototype._connectionLength = 1;
    physics.ParticleSimulation.prototype._connectionSpringConstant = 1;
    physics.ParticleSimulation.prototype._width = 1;
    physics.ParticleSimulation.prototype._height = 1;
    physics.ParticleSimulation.prototype._top = 1;
    physics.ParticleSimulation.prototype._left = 1;
    physics.ParticleSimulation.prototype._forceDissipationFunction = {};
    physics.ParticleSimulation.prototype._particles = [];

    // register DisposeParticleMetaData event
    {
        physics.Particle.prototype._onDisposeParticleMetaData = new Array();

        physics.Particle.prototype.SubscribeOnDisposeParticleMetaData = function(subscriber, eventHandler)
        {
            if (subscriber != null && eventHandler != null)
            {
                this._onDisposeParticleMetaData.push([subscriber, eventHandler]);
            }
            else
            {
                throw "subscriber and/or eventHandler cannot be null";
            }
        };

        physics.Particle.prototype.UnSubscribeOnDisposeParticleMetaData = function(subscriber)
        {
            for(var i = 0; i < this._onDisposeParticleMetaData.length; i++)
            {
                if (this._onDisposeParticleMetaData[i][0] == subscriber)
                {
                    if (i == 0)
                    {
                        this._onDisposeParticleMetaData = this._onDisposeParticleMetaData.shift();
                    }
                    else if (i == this._onDisposeParticleMetaData.length)
                    {
                        this._onDisposeParticleMetaData = this._onDisposeParticleMetaData.pop();
                    }
                    else
                    {
                        var upperArray = this._onDisposeParticleMetaData.splice(0, i);
                        var lowerArray = this._onDisposeParticleMetaData.splice(i + 1);

                        this._onDisposeParticleMetaData = upperArray.concat(lowerArray);
                    }

                    return;
                }
            }
        };

        physics.Particle.prototype.OnDisposeParticleMetaData = function(source, connectorMetaData)
        {
            for(var i in this._onDisposeParticleMetaData)
            {
                var subscriberHandler = this._onDisposeParticleMetaData[i];
                try
                {
                    subscriberHandler[1].call(subscriberHandler[0], source, connectorMetaData);
                }
                catch(error)
                {
                    alert("error while calling" + subscriberHandler[1] + "on " + subscriberHandler[0] + " , error: " + error);
                }
            }
        }
    }

    // register getters and setters
    {
        physics.ParticleSimulation.prototype.GetTop = function()
        {
            return this._top;
        };

        physics.ParticleSimulation.prototype.SetTop = function(top)
        {
            this._top = top;
        };

        physics.ParticleSimulation.prototype.GetLeft = function()
        {
            return this._left;
        };

        physics.ParticleSimulation.prototype.SetLeft = function(left)
        {
            this._left = left;
        };

        physics.ParticleSimulation.prototype.GetWidth = function()
        {
            return this._width;
        };

        physics.ParticleSimulation.prototype.SetWidth = function(width)
        {
            this._width = width;
        };

        physics.ParticleSimulation.prototype.GetHeight = function()
        {
            return this._height;
        };

        physics.ParticleSimulation.prototype.SetHeight = function(height)
        {
            this._height = height;
        };

        physics.ParticleSimulation.prototype.GetGravity = function()
        {
            return this._gravity;
        };

        physics.ParticleSimulation.prototype.SetGravity = function(gravity)
        {
            this._gravity = gravity;
        };

        physics.ParticleSimulation.prototype.GetFrictionConstant = function()
        {
            return this._frictionConstant;
        };

        physics.ParticleSimulation.prototype.SetFrictionConstant = function(frictionConstant)
        {
            this._frictionConstant = frictionConstant;
        };

        physics.ParticleSimulation.prototype.GetStaticFriction = function()
        {
            return this._staticFriction;
        };

        physics.ParticleSimulation.prototype.SetStaticFriction = function(staticFriction)
        {
            this._staticFriction = staticFriction;
        };

        physics.ParticleSimulation.prototype.GetConnectionLength = function()
        {
            return this._connectionLength;
        };

        physics.ParticleSimulation.prototype.SetConnectionLength = function(connectionLength)
        {
            this._connectionLength = connectionLength;
        };

        physics.ParticleSimulation.prototype.GetConnectionSpringConstant = function()
        {
            return this._connectionSpringConstant;
        };

        physics.ParticleSimulation.prototype.SetConnectionSpringConstant = function(connectionSpringConstant)
        {
            this._connectionSpringConstant = connectionSpringConstant;
        };

        physics.ParticleSimulation.prototype.GetForceDissipationFunction = function()
        {
            return this._forceDissipationFunction;
        };

        physics.ParticleSimulation.prototype.SetForceDissipationFunction = function(forceDissipationFunction)
        {
            this._forceDissipationFunction = forceDissipationFunction;
        };

        physics.ParticleSimulation.prototype.GetParticles = function()
        {
            return this._particles;
        }
    }

    // find out if particle with metadata was already added
    physics.ParticleSimulation.prototype.HasParticleMetadata = function(metadata)
    {
        for(var i in this._particles)
        {
            var particle = this._particles[i];
            if (particle.GetMetaData() == metadata)
            {
                return true;
            }
        }

        return false;
    };

    physics.ParticleSimulation.prototype.AddParticle = function(particle, particleMetaData)
    {
        particle.SetMetaData(particleMetaData);
        this._particles = physics.helper.AddElementToArray(this._particles, particle);
    };

    physics.ParticleSimulation.prototype.RemoveParticle = function(particle)
    {
        particle.DisconnectParticle();
        this.OnDisposeParticleMetaData(this, particle.GetMetaData());
        this._particles = physics.helper.RemoveElementFromArray(this._particles, particle);
    };

    /// <summary>
    /// adds a particle to the simulation and connects it with another particle
    /// </summary>
    /// <param name="p">the particle to add</param>
    /// <param name="p1">the particle to connect it to</param>
    physics.ParticleSimulation.prototype.AddParticleToParticle = function(particle, particleMetaData, particle1, connectorMetaData)
    {
        this.AddParticle(particle, particleMetaData);
        particle1.AddConnection(particle, connectorMetaData, this.GetConnectionLength(), this.GetConnectionSpringConstant());
    };

    physics.ParticleSimulation.prototype.RunSimulation = function(timeStep)
    {
        this.AccumulateForces();
        this.Verlet(timeStep);
        this.SatisfyConstraints();
    };

    /// <summary>
    /// work out the new positions of all the particles based on the forces acting on the particles
    /// </summary>
    /// <param name="step"></param>
    physics.ParticleSimulation.prototype.Verlet = function(timeStep)
    {
        for(var i in this._particles)
        {
            var particle = this._particles[i];
            if (!particle.GetDoPhysics())
            {
                continue;
            }

            var previousPosition = particle.GetPosition().Clone();

            // get the force acting in the particle
            var acceleration = particle.GetAccumulatedForces().Clone();

            // if the force is greater than the static friction threshold then convert the
            // force into an acceleration
            if (physics.Vector.Length(acceleration) >= this.GetStaticFriction())
            {
                acceleration = physics.Vector.MultiplyLength(acceleration, timeStep * timeStep * particle.GetInvMass());

                // model the effects of friction
                var newPosition = physics.Vector.Subtract(particle.GetPosition(), particle.GetPreviousPosition());
                newPosition =  physics.Vector.MultiplyLength(newPosition, this.GetFrictionConstant());

                // update the positions
                particle.SetPosition(
                    physics.Vector.Sum(particle.GetPosition(),
                        physics.Vector.Sum(newPosition, acceleration)));
                particle.SetPreviousPosition(previousPosition);
            }
            else
            {
                particle.SetPreviousPosition( previousPosition);
            }
        }
    };

    physics.ParticleSimulation.prototype.SatisfyConstraints = function()
    {
        for(var i in this._particles)
        {
            var particle = this._particles[i];

            var thresholdPosition = new physics.Vector(
                Math.min(Math.max(this.GetLeft(), particle._position._x), this.GetWidth() + this.GetLeft()),
                Math.min(Math.max(this.GetTop(), particle._position._y), this.GetHeight() + this.GetTop())
            );

            particle.SetPosition(thresholdPosition);
        }
    };

    /// <summary>
    /// calculate the total force acting on each particle at the current instant
    /// </summary>
    physics.ParticleSimulation.prototype.AccumulateForces = function()
    {
        for(var i in this._particles)
        {
            var particle = this._particles[i];

            particle.SetAccumulatedForces(new physics.Vector(0, this.GetGravity())); // gravity is from up to down
            particle.SetAccumulatedForces(physics.Vector.Sum(particle.GetAccumulatedForces(), particle.AccumulateConnectorForces()));

            for(var j in this._particles)
            {
                var otherParticle = this._particles[j];

                if (otherParticle != particle)
                {
                    particle.SetAccumulatedForces(
                        physics.Vector.Sum(particle.GetAccumulatedForces(), otherParticle.RestingForceAtPosition(particle.GetPosition())));
                }
            }
        }
    }
}

