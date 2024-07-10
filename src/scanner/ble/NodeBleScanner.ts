import EventEmitter from "events";
import { ScannerInterface, ScannerStateType } from "../ScannerInterface";
import * as NodeBle from 'node-ble';

export class NodeBleScanner extends EventEmitter implements ScannerInterface {
    public scannerState: ScannerStateType = "unknown";
    protected adapter?: NodeBle.Adapter;
    protected bluetooth?: NodeBle.Bluetooth;
    protected destroy?: () => void;

    constructor(protected uuids: string[] = []) {
        super();
    }

    protected async getBluetooth(): Promise<NodeBle.Bluetooth> {
        if (this.bluetooth) {
            return this.bluetooth;
        }
        const {bluetooth, destroy} = NodeBle.createBluetooth();
        this.bluetooth = bluetooth;
        this.destroy = destroy;
        return this.bluetooth;
    }

    protected async getAdapter(): Promise<NodeBle.Adapter> {
        if (this.adapter) {
            return this.adapter;
        }
        const bluetooth = await this.getBluetooth();
        this.adapter = await bluetooth.defaultAdapter();
        let counter = 5;
        while (!await this.adapter.isPowered() && counter > 0) {
            this.scannerState = "starting";
            await new Promise(resolve => setTimeout(resolve, 10));
            counter--;
        }
        if (!await this.adapter.isPowered()) {
            throw new Error("Bluetooth adapter not powered on");
        }
        this.emit('ready');
        return this.adapter;
    }

    async startScan(passive: boolean): Promise<boolean> {
        const adapter = await this.getAdapter();
        if(!await adapter.isDiscovering()){
            await adapter.startDiscovery();
        }
        this.emit('startScan')
        this.scannerState = "scanning";
        for (const uuid of this.uuids) {
            adapter.waitDevice(uuid).then(device => {
                this.emit('discover', device);
            });
        }

        return true;
    }
    async stopScan(): Promise<boolean> {
        const adapter = await this.getAdapter();
        if(await adapter.isDiscovering()){
            await adapter.stopDiscovery();
        }
        this.scannerState = "stopped";
        return true;
    }
    getState(): ScannerStateType {
        return this.scannerState;
    }

}
