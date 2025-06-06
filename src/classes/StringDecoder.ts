import * as URL from "url";
import * as URLSearchParams from "@ungap/url-search-params";

import StringTypeDetector from "./StringTypeDetector";
import {
  XummPayloadReference,
  XummPairingToken,
  XummTranslation,
  XrplDestination,
  XrplDestinationTag,
  XrplTransactionHash,
  XrplSecret,
  XrplSignedTransaction,
  XrplTransactionTemplate,
  PayId,
  XummFeature,
  XrplAltFamilySeedAlphabet,
  XummXapp,
} from "../types";
import SecretType from "../enums/SecretType";
import { tryUrlParams } from "../helpers";

class StringDecoder {
  input: StringTypeDetector;

  constructor(input: StringTypeDetector) {
    this.input = input;
  }

  getXrplDestination(): XrplDestination {
    const result: XrplDestination = { to: this.input.getStrippedInput() };
    let searchParams: URLSearchParams;

    if (!this.input.isUrl()) {
      if (
        this.input.getRawInput().split("&").length > 0 &&
        this.input.getRawInput().split("=").length > 0
      ) {
        // Try URI syntax
        let tryParseUri: string = this.input.getRawInput();
        if (this.input.getRawInput().match(/^\?/)) {
          tryParseUri = "https://localhost/" + this.input.getRawInput();
        } else if (this.input.getRawInput().match(/^[a-z0-9[\]]+=.+/)) {
          tryParseUri = "https://localhost/?" + this.input.getRawInput();
        } else if (this.input.getRawInput().match(/^[rX][a-zA-Z0-9]{20,}/)) {
          tryParseUri = "https://localhost/?to=" + this.input.getRawInput();
        }

        /**
         * Try invalid or non-URI syntax
         */
        if (
          this.input.getRawInput().match(/\?[a-zA-Z0-9_[\]]+=.+/) &&
          this.input.getRawInput().replace(/^\?/, "").split("?").length === 2 &&
          !this.input.getRawInput().match(/:\/\//)
        ) {
          // r9JynAPy1xUEW2bAYK36fy5dKKNNNKK1Z5?dt=123
          tryParseUri =
            "https://localhost/?to=" +
            this.input.getRawInput().replace(/^\?/, "").replace(/\?/, "&");
        } else if (
          this.input.getRawInput().match(/^r[a-zA-Z0-9]{20,}[-: ]+[0-9]+$/) &&
          !this.input.getRawInput().match(/:\/\//)
        ) {
          // rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT:1234
          tryParseUri =
            "https://localhost/?to=" +
            this.input.getRawInput().replace(/[-: ]+/, "&dt=");
        } else if (
          this.input.getRawInput().match(/\?r[a-zA-Z0-9]{20,}/) &&
          !this.input.getRawInput().match(/[?&]to=r[a-zA-Z0-9]{20,}/)
        ) {
          // scheme://uri/folders?rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY:123
          tryParseUri = this.input.getRawInput().replace(/\?/, "?to=");
        } else if (
          this.input
            .getRawInput()
            .trim()
            .match(/[\n\r]/) &&
          this.input
            .getRawInput()
            .match(
              /r[a-zA-Z0-9]{20,}.*[\r\n\t]+|[\r\n\t]+.*r[a-zA-Z0-9]{20,}/g
            ) &&
          !this.input.getRawInput().match(/:\/\//)
        ) {
          const to = this.input.getRawInput().match(/r[a-zA-Z0-9]{20,}/);
          const tag = this.input
            .getRawInput()
            .slice(to.index + to[0].length)
            .match(/[0-9]+/g);
          tryParseUri =
            "https://localhost/?to=" +
            to[0] +
            (tag && typeof tag[0] === "string" && tag[0] !== ""
              ? "&dt=" + tag[0]
              : "");
        } else if (this.input.getRawInput().match(/\/r[a-zA-Z0-9]{20,}[?&]/)) {
          tryParseUri = this.input
            .getRawInput()
            .replace(/(\/)(r[a-zA-Z0-9]{20,})([?&])/, "$1?to=$2&");
        }

        /**
         * Recover destination tag notation
         */
        if (
          tryParseUri.match(/[?&]to=r[a-zA-Z0-9]{20,}[-: ]+[0-9]+/) &&
          !tryParseUri.match(/[?&](dt|tag|destinationtag)=/)
        ) {
          tryParseUri = tryParseUri.replace(
            /([?&]to=r[a-zA-Z0-9]{20,})[-: ]+([0-9]+)/,
            "$1&dt=$2"
          );
        }

        /**
         * Try parsing
         */
        try {
          const url = URL.parse(tryParseUri);
          searchParams = new URLSearchParams(url.query || "");
        } catch {
          // Continue
        }
      }
    } else {
      searchParams = this.input.getSearchParams();
    }

    if (searchParams && searchParams.has("to")) {
      const XrplDestinationOutput = {
        to: searchParams.get("to"),
        tag: tryUrlParams(
          searchParams,
          ["tag", "dt", "dtag", "destinationtag"],
          Number
        ) as undefined,
        invoiceid: tryUrlParams(
          searchParams,
          ["invoice", "invoiceid", "invid", "inv"],
          String
        ) as undefined,
        amount: tryUrlParams(searchParams, ["amount"], String) as undefined,
        currency: tryUrlParams(
          searchParams,
          ["currency", "iou"],
          String
        ) as string,
        issuer: tryUrlParams(searchParams, ["issuer"], String) as string,
        network: tryUrlParams(searchParams, ["network"], String) as string,
      };

      if (
        XrplDestinationOutput.currency !== undefined &&
        XrplDestinationOutput.issuer === undefined &&
        XrplDestinationOutput.currency.split(":").length === 2
      ) {
        const splitCurrency = XrplDestinationOutput.currency.split(":");
        if (splitCurrency[1].length === 3) {
          XrplDestinationOutput.issuer = splitCurrency[0];
          XrplDestinationOutput.currency = splitCurrency[1];
        } else if (splitCurrency[0].length === 3) {
          XrplDestinationOutput.currency = splitCurrency[0];
          XrplDestinationOutput.issuer = splitCurrency[1];
        }
      }

      return XrplDestinationOutput;
    }

    return result;
  }

  getXrplDestinationTag(): XrplDestinationTag {
    return {
      tag: Number(this.input.getStrippedInput()),
    };
  }

  getXrplSecret(): XrplSecret {
    if (this.input.getStrippedInput().match(/^([a-z]{3,}\s){11,}[a-z]{3,}$/i)) {
      return {
        secretType: SecretType.Mnemonic,
        mnemonic: this.input.getStrippedInput().toLowerCase(),
      };
    }

    if (
      this.input
        .getStrippedInput()
        .match(
          /^s[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{20,}/
        )
    ) {
      return {
        secretType: SecretType.FamilySeed,
        familySeed: this.input.getStrippedInput(),
      };
    }

    if (this.input.getStrippedInput().match(/^[A-F0-9]{66}$/)) {
      return {
        secretType: SecretType.Hex,
        hexPrivateKey: this.input.getStrippedInput().toUpperCase(),
      };
    }
  }

  getXummPayloadReference(): XummPayloadReference {
    return {
      uuid: this.input.getStrippedInput(),
    };
  }

  getXummPairingToken(): XummPairingToken {
    return {
      token: this.input.getStrippedInput(),
    };
  }

  getXummTranslation(): XummTranslation {
    return {
      uuid: this.input.getStrippedInput(),
    };
  }

  getPayId(): PayId {
    const payIdSplitted = this.input.getStrippedInput().split("$");
    const payIdAsUrl = URL.parse(
      "https://" + payIdSplitted[1] + "/" + payIdSplitted[0]
    );

    return {
      payId: this.input.getStrippedInput(),
      url: payIdAsUrl.href + (payIdAsUrl.path === "/" ? ".well-known/pay" : ""),
    };
  }

  getXrplTransactionHash(): XrplTransactionHash {
    return {
      txhash: this.input.getStrippedInput().trim(),
    };
  }

  getXrplSignedTransaction(): XrplSignedTransaction {
    return {
      txblob: this.input.getStrippedInput().trim(),
    };
  }

  getXrplTransactionTemplate(): XrplTransactionTemplate {
    return {
      jsonhex: this.input.getStrippedInput().trim(),
    };
  }

  getXrplAltFamilySeedAlphabet(): XrplAltFamilySeedAlphabet {
    const alphabet = this.input.getSearchParams().get("alphabet");

    const output = {
      name: this.input.getStrippedInput().trim(),
      alphabet:
        typeof alphabet === "string" &&
        alphabet.match(
          /^[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]{58}$/
        )
          ? alphabet
          : false,
    };

    if (this.input.getSearchParams().toString() !== "") {
      const params = {};
      this.input.getSearchParams().forEach((v, k) => {
        if (["name", "type", "alphabet"].indexOf(k) < 0) {
          Object.assign(params, {
            [k]: v,
          });
        }
      });
      if (Object.keys(params).length > 0) {
        Object.assign(output, { params });
      }
    }

    return output;
  }

  getXummFeature(): XummFeature {
    const output = {
      feature: this.input.getStrippedInput().trim(),
      type: this.input.getSearchParams().get("type").trim(),
    };

    if (this.input.getSearchParams().toString() !== "") {
      const params = {};
      this.input.getSearchParams().forEach((v, k) => {
        if (["type", "feature"].indexOf(k) < 0) {
          Object.assign(params, {
            [k]: v,
          });
        }
      });
      if (Object.keys(params).length > 0) {
        Object.assign(output, { params });
      }
    }

    return output;
  }

  getXummXapp(): XummXapp {
    const output = {
      xapp: this.input.getStrippedInput().toLowerCase().trim(),
    };

    const path = this.input.getRawInput().split("/").pop().split("?")[0];
    if (
      typeof path === "string" &&
      path !== "" &&
      path !== "xapp:" + output.xapp
    ) {
      Object.assign(output, {
        path: this.input.getRawInput().split("/").pop().split("?")[0],
      });
    }

    if (this.input.getSearchParams().toString() !== "") {
      const params = {};
      this.input.getSearchParams().forEach((v, k) => {
        Object.assign(params, {
          [k]: v,
        });
      });
      Object.assign(output, {
        params,
      });
    }

    return output;
  }

  getAny() {
    return this["get" + this.input.getTypeName()]();
  }

  getInvalid(): void {
    return;
  }
}

export default StringDecoder;
