import {CORSValidator} from "./CORSValidator";
import {ContentServerValidator} from "./ContentServerValidator";

export class ContentServerValidatorFactory {

    newValidator(name: string, config: any): ContentServerValidator {
        switch (name) {
            case "cors":
                return new CORSValidator(<string>config);
            default:
                throw new Error(`${name} validator not supported`);
        }
    };
}