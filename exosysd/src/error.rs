#[derive(Debug)]
pub enum Error {
    Fetch { address: String, error: String },
    NotHex(NotHex),
    NotParachain { address: String },
    NotRelay { address: String },
    ParachainNotOnList { address: String },
    Scale(Decoding),
    UnexpectedJsonValue(UnexpectedJsonValue),
}

#[derive(Debug)]
pub enum NotHex {
    ParaId,
    RelayParaSet,
    Value,
}

#[derive(Debug)]
pub enum Decoding {
    ParaId,
    RelayParaSet,
}

#[derive(Debug)]
pub enum UnexpectedJsonValue {
    ParaId,
    RelayParaSet,
}
