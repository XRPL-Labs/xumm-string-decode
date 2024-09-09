import SecretType from '../enums/SecretType'

export interface XrplSecret {
  secretType: SecretType
  familySeed?: string
  mnemonic?: string
  hexPrivateKey?: string
}
