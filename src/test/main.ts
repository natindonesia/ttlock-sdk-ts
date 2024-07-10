import * as NodeBle from 'node-ble'

const {bluetooth, destroy} = NodeBle.createBluetooth()


process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);

});

// ttlock test
async function main() {
    const adapter = await bluetooth.defaultAdapter()
    if (!await adapter.isDiscovering())
        await adapter.startDiscovery()
    console.log("Discovering...")
    while (true) {
        try {
            const device = await adapter.waitDevice('F2:C1:AD:4C:AE:FD')
            console.log("Found device")
            await device.connect()
            console.log("Connected")

            const manufactureData = await device.getManufacturerData()
            console.log("Manufacturer data", manufactureData)



            console.log("Connected")
            const gattServer = await device.gatt()

            // list services
            console.log("Services")
            const services = await gattServer.services()
            console.log(services)
            // get primary service
            for (const serviceUuid of services) {
                const service = await gattServer.getPrimaryService(serviceUuid)
                for (const characteristicUuid of await service.characteristics()) {
                    const characteristic = await service.getCharacteristic(characteristicUuid)
                    console.log("Characteristic", characteristicUuid)
                    const value = await characteristic.readValue()
                    console.log("Value", value)
                }
            }
            break;
        } catch (e) {
            console.error(e+"")
        }

    }
}

main().catch(console.error).finally(() => {
    destroy()
})

