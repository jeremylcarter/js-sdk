import IServer from '../../interfaces/Server/IServer';
import IServerPubSub from '../../interfaces/Server/IServerPubSub';
import IServerBinding from '../../interfaces/Server/IServerBinding';
import IServerInvoker from '../../interfaces/Server/IServerInvoker';
import IServerActor from '../../interfaces/Server/IServerActor';

import CommunicationProtocolEnum from '../../enum/CommunicationProtocol.enum';
import GRPCServer from './GRPCServer/GRPCServer';
import GRPCServerPubSub from './GRPCServer/pubsub';
import GRPCServerBinding from './GRPCServer/binding';
import GRPCServerInvoker from './GRPCServer/invoker';
import GRPCServerActor from './GRPCServer/actor';

import HTTPServer from './HTTPServer/HTTPServer';
import HTTPServerPubSub from './HTTPServer/pubsub';
import HTTPServerBinding from './HTTPServer/binding';
import HTTPServerInvoker from './HTTPServer/invoker';
import HTTPServerActor from './HTTPServer/actor';
import { DaprClientOptions } from '../../types/DaprClientOptions';
import { DaprClient } from '../..';

export default class DaprServer {
  // App details
  private readonly serverHost: string;
  private readonly serverPort: string;
  // Dapr Sidecar
  private readonly daprHost: string;
  private readonly daprPort: string;

  readonly daprServer: IServer;
  readonly pubsub: IServerPubSub;
  readonly binding: IServerBinding;
  readonly invoker: IServerInvoker;
  readonly actor: IServerActor;
  readonly client: DaprClient;

  constructor(
    serverHost = "127.0.0.1"
    , serverPort: string = process.env.DAPR_SERVER_PORT || "50050"
    , daprHost = "127.0.0.1"
    , daprPort = "50051"
    , communicationProtocol: CommunicationProtocolEnum = CommunicationProtocolEnum.HTTP
    , clientOptions: DaprClientOptions = {
      isKeepAlive: true
    }
  ) {
    this.serverHost = serverHost;
    this.serverPort = serverPort;
    this.daprHost = daprHost;
    this.daprPort = daprPort;

    // Create a client to interface with the sidecar from the server side
    this.client = new DaprClient(daprHost, daprPort, communicationProtocol, clientOptions);

    // If DAPR_SERVER_PORT was not set, we set it
    process.env.DAPR_SERVER_PORT = this.serverPort;
    process.env.DAPR_CLIENT_PORT = this.daprPort;

    // Validation on port
    if (!/^[0-9]+$/.test(this.serverPort)) {
      throw new Error('DAPR_SERVER_INCORRECT_SERVER_PORT');
    }

    if (!/^[0-9]+$/.test(this.daprPort)) {
      throw new Error('DAPR_SERVER_INCORRECT_SIDECAR_PORT');
    }

    // Builder
    switch (communicationProtocol) {
      case CommunicationProtocolEnum.GRPC: {
        const server = new GRPCServer(this.client);
        this.daprServer = server;

        this.pubsub = new GRPCServerPubSub(server);
        this.binding = new GRPCServerBinding(server);
        this.invoker = new GRPCServerInvoker(server);
        this.actor = new GRPCServerActor(server);
        break;
      }
      case CommunicationProtocolEnum.HTTP:
      default: {
        const server = new HTTPServer(this.client);
        this.daprServer = server;

        this.pubsub = new HTTPServerPubSub(server);
        this.binding = new HTTPServerBinding(server);
        this.invoker = new HTTPServerInvoker(server);
        this.actor = new HTTPServerActor(server, this.client);
        break;
      }
    }
  }

  async start(): Promise<void> {
    await this.daprServer.start(this.serverHost, this.serverPort.toString());
  }

  async stop(): Promise<void> {
    await this.daprServer.stop();
  }

  async stopServer(): Promise<void> {
    await this.daprServer.stopServer();
  }

  getDaprClient(): IServer {
    return this.daprServer;
  }

  getDaprHost(): string {
    return this.daprHost;
  }

  getDaprPort(): string {
    return this.daprPort;
  }
}