# XUMM String Decode

JS/TS lib to decode strings for the xrpl-labs.com XUMM app (when scanning a QR code).

Supports:

  - XrplDestination, eg. r... or [X...](https://xrpaddress.info/), optionally URI syntax (containing amount, IOU, destination tag, etc.)
  - XummPayloadReference (UUIDv4)
  - XummPairingToken
  - XrplTransactionHash
  - XrplSecret (mnemonic, family seed (s....) or HEX private key)
  - XrplSignedTransaction (signed HEX blob)
  - XrplTransactionTemplate (HEX encoded JSON transaction template)
