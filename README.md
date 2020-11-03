# XUMM String Decode

JS/TS lib to decode strings for the xrpl-labs.com XUMM app (when scanning a QR code).

Supports:

  - XrplDestination, eg. r... or [X...](https://xrpaddress.info/), optionally URI syntax (containing amount, IOU, destination tag, etc.)
  - XrplDestinationTag (32-bit unsigned integers)
  - XummPayloadReference (UUIDv4)
  - XummPairingToken
  - XummTranslation
  - XrplTransactionHash
  - XrplSecret (mnemonic, family seed (s....) or HEX private key)
  - XrplSignedTransaction (signed HEX blob)
  - XrplTransactionTemplate (HEX encoded JSON transaction template)
  - PayId ($host/path where XrplDestination can be retrieved)

The lib. exports:

  - `StringTypeDetector` (class)
  - `StringDecoder` (class)
  - `StringType` (enum)
  - `SecretType` (enum)


## Sample

### 1. Detect string type

```
const someString = 'https://ripple.com//send?to=rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT&amount=30&dt=123'
const detected = new StringTypeDetector(someString)
```

#### Methods

The sample (above) will expose these methods on `detected`:

  - `getType()`, returns one of the `StringType` enum values
  - `getTypeName()`, returns `StringType` enum string value

In case a valid string (type) could not be found, `StringType.Invalid` will be returned by `getType()`.

Other available methods (you probably won't need to use:

  - `getStrippedInput()` (string)
  - `getInput()` (string)
  - `getRawInput()` (string)
  - `isUrl()` (boolean)
  - `getSearchParams()` (URLSearchParams, in case of URI input)

#### String types

  - `StringType.Invalid`
  - `StringType.XummPayloadReference`
  - `StringType.XummPairingToken`
  - `StringType.XummTranslation`
  - `StringType.XrplTransactionHash`
  - `StringType.XrplDestination`
  - `StringType.XrplDestinationTag`
  - `StringType.XrplSignedTransaction`
  - `StringType.XrplTransactionTemplate`
  - `StringType.XrplSecret`
  - `StringType.IlpStreamInstruction`
  - `StringType.PayId`

### 2. Decode values

Once a string type is detected with the `StringTypeDetector` and the string is not `StringType.Invalid`, you can get the parsed values in the correct type using the `StringDecoder` class:

```
// Use the previous sample (above, StringTypeDetector) as input:
const decoded = new StringDecoder(detected)
console.log(decoded.getAny())
```

The methods available on the `StringDecoder` object:

  - `getXrplDestination()`, returns _XrplDestination_
  - `getXrplDestinationTag()`, returns _XrplDestinationTag_
  - `getXrplSecret()`, returns _XrplSecret_
  - `getXummPayloadReference()`, returns _XummPayloadReference_
  - `getXummPairingToken()`, returns _XummPairingToken_
  - `getXummTranslation()`, returns _XummTranslation_
  - `getXrplTransactionHash()`, returns _XrplTransactionHash_
  - `getXrplSignedTransaction()`, returns _XrplSignedTransaction_
  - `getXrplTransactionTemplate()`, returns _XrplTransactionTemplate_
  - `getPayId()`, returns _PayId_

So: you can call the getXxxYyy method based on the detected string type, or just get the right one at once:

  - `getAny()`, returns detected result


### 3. Sample output objects

##### XrplDestination

```
{
  to: string
  tag?: number
  invoiceid?: string
  amount?: string
  currency?: string
  issuer?: string
}
```

##### XrplDestinationTag

```
{
  tag: number
}
```

##### XummTranslation

```
{
  uuid: string
}
```

##### XrplSecret

```
{
  secretType: SecretType
  familySeed?: string
  mnemonic?: string
  hexPrivateKey?: string
}
```

> The `SecretType` (enum) can be one of:

> ```
> { FamilySeed, Hex, Mnemonic }
> ```

##### XrplSignedTransaction

```
{
  txblob: string
}
```

##### XrplTransactionHash

```
{
  txhash: string
}
```

##### XrplTransactionTemplate

```
{
  jsonhex: string
}
```

##### XummPairingToken

```
{
  token: string
}
```

##### XummPayloadReference

```
{
  uuid: string
}
```

##### PayId

```
{
  payId: string,
  url: string
}
```
