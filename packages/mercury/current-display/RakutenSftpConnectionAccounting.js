const globalRegistry={active:0};
const freeze=value=>Object.freeze({...value});

export class RakutenSftpConnectionAccounting {
    constructor({registry=globalRegistry,routineLimit=1,hardLimit=5}={}){
        if(!registry||!Number.isInteger(registry.active)||registry.active<0||!Number.isInteger(routineLimit)||routineLimit<1||!Number.isInteger(hardLimit)||hardLimit<1||hardLimit>5||routineLimit>hardLimit)throw new Error("SFTP_CONNECTION_ACCOUNTING_INVALID");
        this.registry=registry;this.routineLimit=routineLimit;this.hardLimit=hardLimit;this.reset();
    }
    reset(){this.connectionsOpened=0;this.connectionsReady=0;this.connectionsClosedGracefully=0;this.connectionsDestroyedAsFallback=0;this.connectionsFailedBeforeReady=0;this.cleanupAttempts=0;this.cleanupFailures=0;this.activeConnectionsAtStart=this.registry.active;this.peakLocalConcurrentConnections=this.registry.active;this.reserved=false;this.ready=false;this.released=false;}
    reserve(){if(this.registry.active>=this.hardLimit)throw new Error("SFTP_CONNECTION_HARD_LIMIT_REACHED");if(this.registry.active>=this.routineLimit)throw new Error("SFTP_LOCAL_CONNECTION_ACTIVE");this.registry.active+=1;this.reserved=true;this.connectionsOpened+=1;this.peakLocalConcurrentConnections=Math.max(this.peakLocalConcurrentConnections,this.registry.active);}
    markReady(){if(this.reserved&&!this.released&&!this.ready){this.ready=true;this.connectionsReady+=1;}}
    beginCleanup(){if(!this.reserved||this.released)return false;this.cleanupAttempts+=1;return true;}
    release({fallback=false,cleanupFailed=false}={}){if(!this.reserved||this.released)return false;if(!this.ready)this.connectionsFailedBeforeReady+=1;if(fallback)this.connectionsDestroyedAsFallback+=1;else this.connectionsClosedGracefully+=1;if(cleanupFailed)this.cleanupFailures+=1;this.registry.active=Math.max(0,this.registry.active-1);this.released=true;return true;}
    snapshot(){return freeze({connectionsOpened:this.connectionsOpened,connectionsReady:this.connectionsReady,connectionsClosedGracefully:this.connectionsClosedGracefully,connectionsDestroyedAsFallback:this.connectionsDestroyedAsFallback,connectionsFailedBeforeReady:this.connectionsFailedBeforeReady,cleanupAttempts:this.cleanupAttempts,cleanupFailures:this.cleanupFailures,activeConnectionsAtStart:this.activeConnectionsAtStart,activeConnectionsAtEnd:this.registry.active,peakLocalConcurrentConnections:this.peakLocalConcurrentConnections});}
}

export function createRakutenSftpConnectionAccounting(options){return new RakutenSftpConnectionAccounting(options);}
