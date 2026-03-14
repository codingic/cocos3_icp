import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Error "mo:base/Error";
import CFSignerdid "CFSignerdid";
import RuntimeConfig "RuntimeConfig";

module {

  let signer : CFSignerdid.Service = actor (RuntimeConfig.signerCanisterId);

  public func getSelfEthPublicKey() : async Blob {
    let derivationPath : [Blob] = [];//0x03856f8412642933e191a3315c49e8cc2ecdc8f629343214de4ba518f36ccb87fa
    let keyName = RuntimeConfig.signerKeyName;


    let args : CFSignerdid.EcdsaPublicKeyArgument = {
      canister_id = null;
      derivation_path = derivationPath;
      key_id = { curve = #secp256k1; name = keyName };
    };

    let payment : ?CFSignerdid.PaymentType = ?#AttachedCycles;
    Cycles.add(10_000_000_000);
    let res = await signer.generic_caller_ecdsa_public_key(args, payment);

    switch (res) {
      case (#Ok response) { response._0_.public_key };
      case (#Err _err) { throw Error.reject("Error getting self public key") };
    };
  };


//pub async fn ecdsa_pubkey_of(principal: &Principal) -> Vec<u8> {
//     let name = read_config(|s| s.ecdsa_key_name.clone());
//     let (key,) = ecdsa_public_key(EcdsaPublicKeyArgument {
//         canister_id: None,
//         derivation_path: Schema::Eth.derivation_path(principal),
//         key_id: EcdsaKeyId {
//             curve: EcdsaCurve::Secp256k1,
//             name,
//         },
//     })
//     .await
//     .expect("failed to get public key");
//     key.public_key
// }
  public func getEthAddress() : async Text {

    let payment : ?CFSignerdid.PaymentType = ?#AttachedCycles;
    Cycles.add(10_000_000_000);
    let res = await signer.eth_address_of_caller( payment);

    switch (res) {
      case (#Ok response) { response.address };
      case (#Err _err) { throw Error.reject("Error getting address") };
    };
  };

  // Signs a message hash using the caller's derived key via Chain Fusion Signer.
  public func signWithSigner(caller : Principal, message_hash : Blob,) : async Blob {
    let derivationPath : [Blob] = [Principal.toBlob(caller)];
    let keyName = RuntimeConfig.signerKeyName;

    let args : CFSignerdid.SignWithEcdsaArgument = {
      message_hash = message_hash;
      derivation_path = derivationPath;
      key_id = { curve = #secp256k1; name = keyName };
    };

    let payment : ?CFSignerdid.PaymentType = ?#PatronPaysIcrc2Cycles {
      owner = caller;
      subaccount = null;
    };

    let res = await signer.generic_sign_with_ecdsa(payment, args);

    switch (res) {
      case (#Ok response) { response._0_.signature };
      case (#Err _err) { throw Error.reject("Error signing") };
    };
  };
};
