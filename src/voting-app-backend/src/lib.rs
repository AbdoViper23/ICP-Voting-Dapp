use candid::{CandidType,Decode,Deserialize,Encode};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{BoundedStorable ,DefaultMemoryImpl, StableBTreeMap,Storable};
use std::{cell::RefCell,borrow::Cow};
use std::collections::HashMap;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const MAX_MEMORY_SIZE:u32=5000;

#[derive(CandidType, Deserialize, Clone, Debug)]
struct Topic{
    title:String,
    options: HashMap<String, u32>, // option [name] -> vote_count
    owner:candid::Principal,
}
impl Topic {
    fn new(title:String, list_of_options:Vec<String>)-> Self{
        let mut options = HashMap::new();
        for op in list_of_options {
            options.insert(op, 0);
        }
        Topic {
            title,
            options,
            owner:ic_cdk::caller(),
        }
    }

    fn vote(&mut self, option: String) -> Result<(), String> {
        if let Some(v) = self.options.get_mut(&option) {
            *v += 1;
            Ok(())
        } else {
            Err(format!("No option with name: {}", option))
        }
    }

    fn add_new_option(&mut self,new_option:String){
        if self.options.contains_key(&new_option) {
            println!("option {} is alrady implenented", new_option);
        } else {
            self.options.insert(new_option, 0);
        }
    }

    fn delete_option(&mut self, option: String) {
        self.options.remove(&option);
    }   
}
  
impl Storable for Topic {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).expect("Failed to Encode with candid"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(),Self).expect("Failed to Decode with candid")
    }
}

impl BoundedStorable for Topic {
    const MAX_SIZE: u32 = MAX_MEMORY_SIZE; 
    const IS_FIXED_SIZE: bool = false;
}

thread_local! {

    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static Topics_map: RefCell<StableBTreeMap<u64, Topic, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
    static NEXT_ID: RefCell<u64> = RefCell::new(0);
}

#[ic_cdk::query]
fn Get_Poll(id:u64)->Option<Topic>{
    Topics_map.with(|mp| mp.borrow().get(&id))
}

#[ic_cdk::query]
fn Get_Polls_count ()->u64 {
    Topics_map.with(|mp| mp.borrow().len())
}

#[ic_cdk::update]
fn Make_Poll(title: String, option_list: Vec<String>) {
    let new_topic = Topic::new(title, option_list);
    Topics_map.with(|mp| {
        NEXT_ID.with(|id_cell: &RefCell<u64>| {
            let mut id: std::cell::RefMut<'_, u64> = id_cell.borrow_mut();
            mp.borrow_mut().insert(*id, new_topic);
            *id += 1;
        });
    });
}

#[ic_cdk::update]
fn vote(id:u64, option:String) {
    Topics_map.with(|mp| {
        let mut map = mp.borrow_mut();

        let mut old = map.get(&id).expect("This ID not found");
        let mut new=old.clone();
        new.vote(option);
        map.insert(id, new);
    });
}


ic_cdk::export_candid!();
