export default interface IClientHealth {
  isHealthy(): Promise<boolean>;
}