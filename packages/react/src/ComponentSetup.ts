import { Setup } from '@goldfishjs/composition-api';

export default class ComponentSetup extends Setup {
  private stopList: Function[] = [];

  private stopAutorunList: (() => void)[] = [];

  private stopWatchList: (() => void)[] = [];

  public setupFnResult: any;

  public setStopList(list: Function[]) {
    this.stopList = list;
  }

  public removeAllStopList() {
    this.stopList.forEach(s => s());
    this.stopList = [];
  }

  public addAutorunStopFn(fn: () => void) {
    this.stopAutorunList.push(fn);
  }

  public stopAllAutorun() {
    this.stopAutorunList.forEach(s => s());
    this.stopAutorunList = [];
  }

  public addWatchStopFn(fn: () => void) {
    this.stopWatchList.push(fn);
  }

  public stopAllWatch() {
    this.stopWatchList.forEach(s => s());
    this.stopWatchList = [];
  }
}
