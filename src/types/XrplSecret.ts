import SecretType from '../enums/SecretType'

export type XrplSecret = {
  secretType: SecretType,
  familySeed?: string,
  mnemonic?: string,
  hexPrivateKey?: string
}
