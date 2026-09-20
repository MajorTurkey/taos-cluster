interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
  };
  value: DataView | null;
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse(data: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: (ev: Event) => void): void;
  removeEventListener(type: string, listener: (ev: Event) => void): void;
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRequestDeviceOptions {
  acceptAllDevices?: boolean;
  optionalServices?: string[];
}

interface Bluetooth {
  requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
