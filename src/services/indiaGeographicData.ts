/**
 * Comprehensive Geographic & Postal Directory for India
 * Hierarchy: State -> District -> Sub-divisions / Postal Divisions -> PIN Codes
 */

export interface PincodeRecord {
  pincode: string;
  officeName: string;
  division: string;
  district: string;
  state: string;
  deliveryType?: 'Standard' | 'Express' | 'SameDay';
  codAvailable?: boolean;
  isActive?: boolean;
  transitDays?: number;
}

export interface SubDivisionData {
  name: string;
  pincodes: PincodeRecord[];
}

export interface DistrictData {
  name: string;
  subDivisions: SubDivisionData[];
}

export interface StateData {
  name: string;
  code: string;
  districts: DistrictData[];
}

export interface DeliveryPincodeRule {
  pincode?: string;
  isActive: boolean;
  deliveryStatus?: 'DELIVERING' | 'EXCLUDED';
  deliveryType?: 'Standard' | 'Express' | 'SameDay';
  deliverySpeed?: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
  codAvailable?: boolean;
  codEnabled?: boolean;
  transitDays?: number;
  feeOverride?: number;
  state?: string;
  district?: string;
  division?: string;
  postOfficeNames?: string[];
  localityNames?: string[];
  source?: string;
  updatedAt?: string;
}

export interface DeliveryCoverageConfig {
  mode: 'all_except_excluded' | 'only_selected'; // Blacklist vs Whitelist
  coveredStates: string[];
  coveredDistricts: string[];
  coveredSubDivisions: string[];
  activePincodes: string[];
  excludedPincodes: string[];
  pincodeRules?: Record<string, DeliveryPincodeRule>;
  lastUpdated?: string;
  notes?: string;
}

// Extensive pre-computed dataset for fast offline lookup and instant UI rendering
export const INDIA_GEOGRAPHIC_DIRECTORY: StateData[] = [
  {
    name: 'West Bengal',
    code: 'WB',
    districts: [
      {
        name: 'Kolkata',
        subDivisions: [
          {
            name: 'Kolkata Central / B.B.D Bagh & Burrabazar',
            pincodes: [
              { pincode: '700001', officeName: 'Kolkata G.P.O. / Dalhousie', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700007', officeName: 'Burrabazar / Posta / MG Road', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700012', officeName: 'Bowbazar / College Street / Central Ave', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700013', officeName: 'Dharamtala / Esplanade / Chandni', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700014', officeName: 'Entally / CIT Road / Moulali', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700016', officeName: 'Park Street / Camac Street / Russell St', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700017', officeName: 'Circus Avenue / Beckbagan', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700069', officeName: 'Raj Bhavan / Governor Estate', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700072', officeName: 'Chandni Chowk / Electronic Market', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700073', officeName: 'Barabazar / Chittaranjan Avenue', division: 'Kolkata Central', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
            ]
          },
          {
            name: 'Kolkata South / Alipore, Ballygunge & Jadavpur',
            pincodes: [
              { pincode: '700019', officeName: 'Ballygunge / Dover Lane', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700020', officeName: 'AJC Bose Road / Exide / Rabindra Sadan', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700025', officeName: 'Bhowanipore / Northern Park', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700026', officeName: 'Kalighat / Hazra Rd', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700027', officeName: 'Alipore Head Post Office / Zoo', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700029', officeName: 'Rash Behari Avenue / Triangular Park', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700031', officeName: 'Dhakuria / Selimpur / Jodhpur Park', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700032', officeName: 'Jadavpur University / 8B Bus Stand', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700033', officeName: 'Tollygunge / Prince Anwar Shah Rd', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700040', officeName: 'Regent Estate / Netaji Nagar', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700045', officeName: 'Lake Gardens / Golf Green', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700047', officeName: 'Naktala / Garia Suburbs', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700053', officeName: 'New Alipore (Block A-N)', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700068', officeName: 'Regent Park / Kudghat', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700075', officeName: 'Santoshpur / Survey Park', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700094', officeName: 'Panchasayar / Peerless Hospital', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700099', officeName: 'Mukundapur / Medica / RN Tagore Area', division: 'Kolkata South', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
            ]
          },
          {
            name: 'Kolkata North & Port / Sealdah, Shyambazar & Cossipore',
            pincodes: [
              { pincode: '700002', officeName: 'Cossipore / Sinthee', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700003', officeName: 'Belgachia / RG Kar Area', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700004', officeName: 'Shyambazar / Hatibagan', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700005', officeName: 'Sovabazar / Baghbazar Ghat', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700006', officeName: 'Beadon Street / Maniktala', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700009', officeName: 'Sealdah Railway Office / APC Rd', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700021', officeName: 'Fort William / Maidan / Red Road', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700022', officeName: 'Hastings / Vidyasagar Setu Toll', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700023', officeName: 'Kidderpore / Watgunge / Khidirpur', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700024', officeName: 'Garden Reach / GRSE Shipyard', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700037', officeName: 'Belgachia Metro / Paikpara', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700050', officeName: 'Baranagar / Dunlop Bridge', division: 'Kolkata North', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
            ]
          },
          {
            name: 'Kolkata East / EM Bypass, Kankurgachi & Phoolbagan',
            pincodes: [
              { pincode: '700010', officeName: 'Beliaghata / CIT Scheme', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700015', officeName: 'Tangra / Seal Lane / Gobinda Khatick Rd', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700039', officeName: 'Topsia / Tiljala / Picnic Garden', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700042', officeName: 'Kasba / Bosepukur / Kasba New Market', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700046', officeName: 'Tangra Chinatown / Dhapa / Science City', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700054', officeName: 'Kankurgachi / Phoolbagan / CIT Rd', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700067', officeName: 'Ultadanga / VIP Road Cross', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700078', officeName: 'Kasba / Haltu / Tribarna', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700085', officeName: 'Salt Lake Gate / Ultadanga Main Rd', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700107', officeName: 'Ruby General Hospital / Kasba East / EM Bypass', division: 'Kolkata East', district: 'Kolkata', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
            ]
          }
        ]
      },
      {
        name: 'North 24 Parganas',
        subDivisions: [
          {
            name: 'Bidhannagar / Salt Lake, New Town, Lake Town & Baguiati',
            pincodes: [
              { pincode: '700028', officeName: 'Dum Dum / Nagar Bazar / Motijheel', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700048', officeName: 'Lake Town / Bangur Avenue / Sreebhumi', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700055', officeName: 'Dum Dum Cantt / Gorabazar', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700059', officeName: 'Baguiati / Deshbandhu Nagar / Jyangra', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700064', officeName: 'Salt Lake Sector I / CC Block', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700074', officeName: 'Dum Dum Park / Bangur / Jessore Rd', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700089', officeName: 'Lake Town Block A-B / Dakshindari', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700091', officeName: 'Salt Lake Sector V (Tech Hub / Millennium)', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700097', officeName: 'Salt Lake Sector II / Purbachal / Karunamoyee', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700098', officeName: 'Salt Lake Sector III / Stadium / Duttabad', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700101', officeName: 'Kestopur / VIP Enclave / Krishnapur', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700102', officeName: 'Kaikhali / VIP Road / Haldirams', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700106', officeName: 'Salt Lake Labony / IB Market', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700135', officeName: 'New Town Action Area I / Rajarhat', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700136', officeName: 'Rajarhat Gopalpur / Chinar Park / Narayanpur', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700156', officeName: 'New Town Action Area II & III / Eco Park', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700157', officeName: 'Hatiara / Dashadrone', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700159', officeName: 'Aswini Nagar / Teghoria / Baguiati East', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700160', officeName: 'New Town Action Area III / Unitech', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700161', officeName: 'New Town Action Area II SO', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700162', officeName: 'Gouranganagar', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700163', officeName: 'New Town Action Area I SO', division: 'Bidhannagar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'SameDay', codAvailable: true, isActive: true, transitDays: 1 },
            ]
          },
          {
            name: 'Barrackpore Sub-division',
            pincodes: [
              { pincode: '700049', officeName: 'Nimta / Belgharia West', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700051', officeName: 'Birati', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700056', officeName: 'Belgharia Head Post Office', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700057', officeName: 'Ariadaha', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700058', officeName: 'Kamarhati', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700076', officeName: 'Dakshineswar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700083', officeName: 'Nandan Nagar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700109', officeName: 'Agarpara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700110', officeName: 'Sodepur', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700111', officeName: 'Ghola Bazar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700112', officeName: 'Pansila', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700113', officeName: 'Natagarh', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700114', officeName: 'Panihati / Sodepur', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700115', officeName: 'Sukchar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700116', officeName: 'B.D. Sopan', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700117', officeName: 'Khardah', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700118', officeName: 'Rahara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700119', officeName: 'Titagarh', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700120', officeName: 'Barrackpore Head Post Office', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700121', officeName: 'Nilganj Bazaar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700122', officeName: 'Nonachandanpukur', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700123', officeName: 'Talpukur', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700158', officeName: 'Bisharpara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743122', officeName: 'Bengal Enamel', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743123', officeName: 'Bhatpara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743124', officeName: 'ESD M', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743125', officeName: 'Jagatdal', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743126', officeName: 'Kankinara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743127', officeName: 'Shyamnagar / Naihati', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743128', officeName: 'Athpur', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743129', officeName: 'Fingapara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743133', officeName: 'Garulia', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743134', officeName: 'Halishahar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743135', officeName: 'Hazinagar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743136', officeName: 'Nabanagar', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743144', officeName: 'Ichapur Nawabganj / Rifle Factory', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743145', officeName: 'Kanchrapara', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743165', officeName: 'Naihati Sub Post Office', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743166', officeName: 'Gorifa', division: 'Barrackpore', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Barasat Sadar Sub-division',
            pincodes: [
              { pincode: '700052', officeName: 'Kolkata Airport (CCU)', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 1 },
              { pincode: '700079', officeName: 'Madhyamgram', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700124', officeName: 'Barasat Head Post Office', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700125', officeName: 'Noapara / Kadambagachi', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700126', officeName: 'Nabapally / Bodai', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700127', officeName: 'Hridaypur', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700128', officeName: 'Badu', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700129', officeName: 'Madhyamgram SO', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700130', officeName: 'Madhyamgram Bazar', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700131', officeName: 'New Barrackpore', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700132', officeName: 'Ganganagar', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700133', officeName: 'Michael Nagar', division: 'Barasat Sadar', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743221', officeName: 'Arkhali Amdanga', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743222', officeName: 'Ashoknagar', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743248', officeName: 'Duttapukur', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743263', officeName: 'Habra Sub Post Office', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743272', officeName: 'Kalyangarh', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743273', officeName: 'Khantura', division: 'Barasat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Bangaon Sub-division',
            pincodes: [
              { pincode: '743235', officeName: 'Bangaon Head Post Office', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743232', officeName: 'Bagdah', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743245', officeName: 'Chandpara Bazar', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743249', officeName: 'Gaighata', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743251', officeName: 'Petrapole Border / Ganrapota', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743252', officeName: 'Gobardanga', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743262', officeName: 'Gopalnagar', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743287', officeName: 'Thakurnagar', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743289', officeName: 'Maslandapur', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743290', officeName: 'Nahata', division: 'Bangaon', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Basirhat Sub-division',
            pincodes: [
              { pincode: '743411', officeName: 'Basirhat Head Post Office', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743412', officeName: 'Basirhat College / RS', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743401', officeName: 'Baduria', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743422', officeName: 'Bhabla', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743423', officeName: 'Deganga', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743424', officeName: 'Debalaya', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743425', officeName: 'Haroa / Minakhan', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743426', officeName: 'Hasnabad', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743428', officeName: 'Kholapota', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743429', officeName: 'Taki Town', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743435', officeName: 'Hingalganj', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743439', officeName: 'Hatgachha / Hemnagar', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743442', officeName: 'Nazat Hatkhola', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743446', officeName: 'Sandeshkhali', division: 'Basirhat', district: 'North 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'South 24 Parganas',
        subDivisions: [
          {
            name: 'Alipore (Sadar) / Behala & Joka',
            pincodes: [
              { pincode: '700008', officeName: 'Barisha', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700018', officeName: 'Bartala', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700034', officeName: 'Behala Chowrasta', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700038', officeName: 'Sahapur', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700041', officeName: 'Paschim Putiari', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700060', officeName: 'Parnasree Pally', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700061', officeName: 'Sarsuna / Shakuntala Park', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700063', officeName: 'Thakurpukur', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700070', officeName: 'Bansdroni', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700084', officeName: 'Garia Sub Post Office', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700103', officeName: 'Narendrapur / Ramakrishna Mission', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700104', officeName: 'Joka / IIM Calcutta', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700137', officeName: 'Budge Budge / Bawali', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700138', officeName: 'Pujali / Achhipur', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700139', officeName: 'Vivekananda Pally / Daulatpur', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700140', officeName: 'Batanagar / Nungi', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700141', officeName: 'Maheshtala', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700143', officeName: 'Sarkarpool', division: 'Alipore Sadar', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Baruipur Sub-division',
            pincodes: [
              { pincode: '700144', officeName: 'Baruipur Head Post Office', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700145', officeName: 'Malancha Mahinagar', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700146', officeName: 'Kodalia', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700147', officeName: 'Subhasgram', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700148', officeName: 'Harinavi', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700149', officeName: 'Rajpur', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700150', officeName: 'Sonarpur', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700151', officeName: 'Dakshin Jagatdal', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '700154', officeName: 'Boral', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743329', officeName: 'Canning Town', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743330', officeName: 'Champahati', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743387', officeName: 'Piyali Town / Dhapdhapi', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743502', officeName: 'Bhangar / Bhojerhat', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743503', officeName: 'Bishnupur South', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743610', officeName: 'Madarat / Dhamua / Hotor', division: 'Baruipur', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Diamond Harbour & Sundarbans Sub-division',
            pincodes: [
              { pincode: '743331', officeName: 'Diamond Harbour Head Post Office', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743312', officeName: 'Basanti / Jharkhali', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743318', officeName: 'Birlapur / Burul', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743332', officeName: 'Hatuganj / Falta Industrial', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743337', officeName: 'Joynagar Majilpur', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743338', officeName: 'Nimpith Ashram / Kultali', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743347', officeName: 'Kakdwip Post Office', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743351', officeName: 'Kulpi', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743355', officeName: 'Magrahat', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743356', officeName: 'Mud Point / Ghoramara Island', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743357', officeName: 'Namkhana / Fraserganj / Bakkhali', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743368', officeName: 'Sarisha / Diamond Harbour Rd', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743370', officeName: 'Gosaba / Dayapur / Pakhiralaya / Sundarban Safari', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743371', officeName: 'Pathar Pratima / Bhagabatpur Crocodile Sanctuary', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743372', officeName: 'Dakshin Barasat / Gocharan / Mathurapur', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743373', officeName: 'Rudranagar / Sagar Island / Gangasagar / Kapil Muni Ashram', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743378', officeName: 'Chhoto Mollakhali / Kumirmari / Sundarbans', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743383', officeName: 'Raidighi / Kankandighi', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743395', officeName: 'South Bishnupur / Mandirbazar / Usthi', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743398', officeName: 'Amtala / Kanyanagar / D.H. Road', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '743399', officeName: 'Dholahat / Kulpi South', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '743504', officeName: 'Falta Export Processing Zone / Belsinga', division: 'Diamond Harbour', district: 'South 24 Parganas', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Howrah',
        subDivisions: [
          {
            name: 'Howrah Sadar Sub-division',
            pincodes: [
              { pincode: '711101', officeName: 'Howrah Head Post Office / Station / Kadamtala', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711102', officeName: 'Salkia / Golabari', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711103', officeName: 'Kadamtala / Bantra / Botanical Garden Rd', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711104', officeName: 'Dasnagar / Shanpur / Baltikuri', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711105', officeName: 'Netajigarh / Bantra East', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711106', officeName: 'Shibpur / IIEST Shibpur / Mandirtala', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711107', officeName: 'Ghusuri / Malipanchghara', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711108', officeName: 'Baksara / Jagacha North', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711109', officeName: 'Danesh Sheikh Lane / Podra / Shalimar Port', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711111', officeName: 'Santragachi / Jagacha / Kona Express', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711112', officeName: 'GIP Colony / Ramrajatala', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711113', officeName: 'Balitikuri / Bankra Link Rd', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711114', officeName: 'Kona / Chamrail / Salap Crossing', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711201', officeName: 'Bally Post Office / Belur', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711202', officeName: 'Belur Math / Ramakrishna Math HQ', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711203', officeName: 'Bhattanagar / Liluah West', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711204', officeName: 'Liluah Railway Town / Don Bosco', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711205', officeName: 'Samabaypalli / Bally Durgapur', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711302', officeName: 'Andul-Mouri / Mourigram / Dhulagori', division: 'Howrah Sadar', district: 'Howrah', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Uluberia Sub-division',
            pincodes: [
              { pincode: '711315', officeName: 'Uluberia Head Post Office', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711303', officeName: 'Bagnan Post Office', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711304', officeName: 'Banipur', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711305', officeName: 'Bauria', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711306', officeName: 'Kulgachia', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711307', officeName: 'Chakasi', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711308', officeName: 'Chengail', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711310', officeName: 'Fort Gloster', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711313', officeName: 'Sankrail Industrial Area', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711314', officeName: 'Shyampur', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '711316', officeName: 'Uluberia RS / Birshibpur', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711322', officeName: 'Panchla', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711401', officeName: 'Amta Post Office', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '711403', officeName: 'Bankra', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711404', officeName: 'Bargachia', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711405', officeName: 'Domjur', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711408', officeName: 'Jagatballavpur', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '711409', officeName: 'Makardaha', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '711410', officeName: 'Munshirhat', division: 'Uluberia', district: 'Howrah', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Hooghly',
        subDivisions: [
          {
            name: 'Chinsurah Sadar Sub-division',
            pincodes: [
              { pincode: '712101', officeName: 'Chinsurah Head Post Office', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712102', officeName: 'Chinsurah RS', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712103', officeName: 'Hooghly SO / Bandel', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712104', officeName: 'Sahaganj / Dunlop Estate', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712123', officeName: 'Bandel Jn Post Office', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712147', officeName: 'Itachuna / Khanyan', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712148', officeName: 'Magra / Polba', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712149', officeName: 'Pandua', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712501', officeName: 'Balagarh', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712502', officeName: 'Bansberia', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712503', officeName: 'Tribeni', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712512', officeName: 'Guptipara', division: 'Chinsurah', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Chandannagar Sub-division',
            pincodes: [
              { pincode: '712136', officeName: 'Chandannagar Head Post Office', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712124', officeName: 'Bhadreswar Town', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712137', officeName: 'Gondalpara', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712138', officeName: 'Khalisani', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712139', officeName: 'Mankundu', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712409', officeName: 'Singur', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712410', officeName: 'Tarakeswar SO', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712302', officeName: 'Dhaniakhali', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712303', officeName: 'Gurap', division: 'Chandannagar', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Serampore Sub-division',
            pincodes: [
              { pincode: '712201', officeName: 'Serampore Head Post Office', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712202', officeName: 'Mahesh', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712222', officeName: 'Baidyabati', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712223', officeName: 'Sheoraphuli', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712232', officeName: 'Bhadrakali / Rishra North', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712233', officeName: 'Hindmotor', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712235', officeName: 'Konnagar', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712245', officeName: 'Makhla / Dankuni Toll Plaza', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712246', officeName: 'Uttarpara Head Post Office', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712248', officeName: 'Rishra SO', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712311', officeName: 'Dankuni SO', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712304', officeName: 'Janai', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712306', officeName: 'Begampur', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712403', officeName: 'Haripal', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712404', officeName: 'Jangipara', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712702', officeName: 'Chanditala', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712706', officeName: 'Seakhala / Furfura Sharif', division: 'Serampore', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Arambagh Sub-division',
            pincodes: [
              { pincode: '712601', officeName: 'Arambagh Head Post Office', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712611', officeName: 'Bengai', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712612', officeName: 'Kamarpukur Ashram Area', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712614', officeName: 'Goghat', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712401', officeName: 'Champadanga', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712402', officeName: 'Dasghara', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712406', officeName: 'Khanakul', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '712407', officeName: 'Nalikul', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '712408', officeName: 'Rajbalhat', division: 'Arambagh', district: 'Hooghly', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          }
        ]
      },
      {
        name: 'Nadia',
        subDivisions: [
          {
            name: 'Krishnanagar Sadar Sub-division',
            pincodes: [
              { pincode: '741101', officeName: 'Krishnanagar Head Post Office', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741102', officeName: 'Saktinagar / Krishnanagar Rajbari', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741103', officeName: 'Ghurni Clay Modeling Colony', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741126', officeName: 'Bethuadahari Wildlife Sanctuary Area', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741137', officeName: 'Debagram', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741139', officeName: 'Dhubulia', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741150', officeName: 'Kaliganj', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741152', officeName: 'Karimpur', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741155', officeName: 'Palashipara', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741156', officeName: 'Plassey / Palashi Battlefield', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741160', officeName: 'Tehatta', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741163', officeName: 'Betai', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741301', officeName: 'Char Brahmanagar', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741302', officeName: 'Nabadwip Head Post Office', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741313', officeName: 'Mayapur ISKCON World HQ', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741315', officeName: 'Swarupganj', division: 'Nadia North', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Ranaghat & Kalyani Sub-divisions',
            pincodes: [
              { pincode: '741201', officeName: 'Ranaghat Head Post Office', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741202', officeName: 'Nasra / Dhantala', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741121', officeName: 'Badkulla', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741127', officeName: 'Birnagar', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741159', officeName: 'Taherpur', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741221', officeName: 'Barajaguli', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741222', officeName: 'Chakdah Post Office', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741234', officeName: 'Gayeshpur Industrial Area', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741235', officeName: 'Kalyani Head Post Office / University', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741238', officeName: 'Gangnapur', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741245', officeName: 'Madanpur', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741246', officeName: 'Haringhata / Mohanpur Farm', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741248', officeName: 'Simurali', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741257', officeName: 'Nagarukhra', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741402', officeName: 'Fulia Handloom Colony', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741404', officeName: 'Santipur Sub Post Office', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741501', officeName: 'Aranghata', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741502', officeName: 'Bagula', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741503', officeName: 'Gede International Border', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741504', officeName: 'Duttapulia', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741505', officeName: 'Hanskhali', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '741506', officeName: 'Krishnaganj', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '741507', officeName: 'Majdia', division: 'Nadia South', district: 'Nadia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Paschim Bardhaman',
        subDivisions: [
          {
            name: 'Durgapur Sub-division',
            pincodes: [
              { pincode: '713201', officeName: 'Durgapur Head Post Office / Station', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713202', officeName: 'Coke Oven Colony', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713203', officeName: 'DSP Steel Project', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713204', officeName: 'Steel Town West / Durgapur 4', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713205', officeName: 'Steel Town East / Sepco', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713206', officeName: 'ABL Township', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713207', officeName: 'DTPS Colony', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713208', officeName: 'ASP Alloy Steel Plant', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713209', officeName: 'NIT Durgapur / REC Area', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713210', officeName: 'MAMC / Heavy Engg Colony', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713211', officeName: 'Sagarbhanga / Durgapur Steel Thermal', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713212', officeName: 'Bidhannagar Durgapur / Mission Hospital', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713213', officeName: 'Benachity Commercial Market / Bhiringi', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713214', officeName: 'Fuljhore / NSHM Knowledge Campus', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713215', officeName: 'Waria / Durgapur Thermal Station', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713216', officeName: 'City Centre Durgapur Hub / Junction Mall', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713385', officeName: 'Laudoha / Andal Mining Belt', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Asansol Sadar Sub-division',
            pincodes: [
              { pincode: '713301', officeName: 'Asansol Head Post Office / Court', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713302', officeName: 'Dhadka / Railpar / Kalyanpur', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713303', officeName: 'Ushagram / BB College / GT Road', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713304', officeName: 'U C Danga / Court Area / SB Gorai Rd', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713305', officeName: 'Ramkrishna Mission Asansol / Sen Raleigh', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713321', officeName: 'Andal Jn / Kazi Nazrul Islam Airport (RND)', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713322', officeName: 'Bahula / Kazi Nazrul University', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713324', officeName: 'Barakar / Maithon Gate', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713325', officeName: 'Burnpur / IISCO Steel Township / Riverside', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713331', officeName: 'Chittaranjan Locoworks (CLW) / Mihijam', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713333', officeName: 'Disergarh / Sanctoria ECL HQ', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713336', officeName: 'Jamuriahat / Nandi', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713338', officeName: 'Kajoragram / Andal Cargo', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713339', officeName: 'Kalipahari / Damodar Valley', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713343', officeName: 'Kulti / Sodepur Colliery', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713346', officeName: 'Pandaveshwar / Ajay Riverfront', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713347', officeName: 'Raniganj Head Post Office / Searsole', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713358', officeName: 'Searsole Rajbari / Raniganj West', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713359', officeName: 'Sitarampur / Neamatpur / Salanpur', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713363', officeName: 'Ukhra / Andal North Belt', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713369', officeName: 'Kalyaneshwari Temple / Maithon Dam West', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713386', officeName: 'Rupnarayanpur / Hindustan Cables', division: 'Asansol', district: 'Paschim Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          }
        ]
      },
      {
        name: 'Purba Bardhaman',
        subDivisions: [
          {
            name: 'Bardhaman Sadar Sub-division',
            pincodes: [
              { pincode: '713101', officeName: 'Bardhaman Head Post Office / Curzon Gate', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713102', officeName: 'Nutanganj / Boro Bazar Bardhaman', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713103', officeName: 'Sripalli / Tinkonia Bus Stand', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713104', officeName: 'Burdwan Rajbati / Golapbag University Campus', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713124', officeName: 'Barsul / Shaktigarh Bypass', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713125', officeName: 'Bhatar / Orgram Forest', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713126', officeName: 'Bhedia / Ajay River Ghat', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713128', officeName: 'Gushkara / Ausgram Forest', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713141', officeName: 'Khana Jn / Railway Junction', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713142', officeName: 'Khandaghosh / Sagrai', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713144', officeName: 'Mankar / Budbud Link', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713145', officeName: 'Monteswar / Majhigram', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713146', officeName: 'Memari Sub Post Office / Rasulpur', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713148', officeName: 'Panagarh Bazar / Kanksa / Air Force Station', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713149', officeName: 'Saktigarh Langcha Hub / NH19 Hub', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713401', officeName: 'Ajhapur / Memari Rural', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713403', officeName: 'Budbud / Debipur', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713406', officeName: 'Galsi / Paraj', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713407', officeName: 'Hatgobindapur', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713408', officeName: 'Jamalpur / Chakdighi', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713421', officeName: 'Raina / Madhabdihi', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713422', officeName: 'Kusumgram / Satgachia / Manteswar', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713423', officeName: 'Sehara / Raina East', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713424', officeName: 'Shyamsundar / College Area', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713427', officeName: 'Uchalan / Arambagh Link', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Kalna Sub-division',
            pincodes: [
              { pincode: '713409', officeName: 'Kalna Head Post Office / 108 Shiva Temples / Rajbari Complex', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713405', officeName: 'Dhatrigram Handloom Weaving Center', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713513', officeName: 'Purbasthali / Oxbow Lake Bird Sanctuary', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713515', officeName: 'Nadanghat / Vidyanagar', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713519', officeName: 'Samudragarh / Nabadwip Ghat Link', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Katwa Sub-division',
            pincodes: [
              { pincode: '713130', officeName: 'Katwa Head Post Office / Keshubhaban', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713150', officeName: 'Srikhanda / Katwa Rural', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '713502', officeName: 'Dainhat Brass Craft Town', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '713512', officeName: 'Patuli / Agradwip Gopinath Mandir', division: 'Burdwan', district: 'Purba Bardhaman', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Birbhum',
        subDivisions: [
          {
            name: 'Bolpur Sub-division',
            pincodes: [
              { pincode: '731204', officeName: 'Santiniketan / Visva Bharati University / Rabindra Bhavana', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731235', officeName: 'Bolpur Head Post Office / Prantik / Sonajhuri Haat', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731236', officeName: 'Sriniketan / BITM College / Kankalitala Shaktipeeth', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731201', officeName: 'Ahmadpur Jn / Railway Colony', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731214', officeName: 'Illambazar Forest Area / Joydev Kenduli', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731215', officeName: 'Khujutipara', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731240', officeName: 'Bahiri / Sian', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731301', officeName: 'Nanoor Heritage Site / Chandidas Birthplace', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731302', officeName: 'Kirnahar', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731303', officeName: 'Labpur / Fullara Shaktipeeth', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Suri Sadar Sub-division',
            pincodes: [
              { pincode: '731101', officeName: 'Suri Head Post Office / District HQ', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731104', officeName: 'Bakreswar Thermal / Hot Springs & Temple', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731121', officeName: 'Abinashpur', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731123', officeName: 'Dubrajpur Mama Bhagne Pahar', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731124', officeName: 'Hetampur Rajbati / College', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731125', officeName: 'Khoyrasole / Lokpur', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731127', officeName: 'MdBazar / Mohammad Bazar Quarry', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731130', officeName: 'Rajnagar / Motichur Mosque Area', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731234', officeName: 'Sainthia Sub Post Office / Nandikeshwari Tala', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Rampurhat Sub-division',
            pincodes: [
              { pincode: '731224', officeName: 'Rampurhat Head Post Office / Railway Junction', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731233', officeName: 'Tarapith Shaktipeeth / Maa Tara Temple', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '731216', officeName: 'Mallarpur / Ganpur Forest', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731219', officeName: 'Murarai / Rajgram', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731220', officeName: 'Nalhati / Nalateswari Temple & Hill', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731221', officeName: 'Paikar / Murarai South', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '731237', officeName: 'Lohapur', division: 'Birbhum', district: 'Birbhum', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'East Midnapore',
        subDivisions: [
          {
            name: 'Tamluk Sadar Sub-division',
            pincodes: [
              { pincode: '721636', officeName: 'Tamluk Head Post Office / Bargabhima Temple', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721628', officeName: 'Mahisadal Rajbari / Geonkhali Confluence', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721131', officeName: 'Kolaghat Thermal Power Plant (KTPS) / Rupnarayan River', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721134', officeName: 'Mecheda Station / Flower & Vegetable Wholesale Market', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721139', officeName: 'Panskura Sub Post Office / Flower Valley', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721151', officeName: 'Nandakumar / Digha Highway Junction', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721627', officeName: 'Geonkhali River Confluence / Mahishadal Port', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721649', officeName: 'Moyna / Moynagarh Historic Island Fort', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721651', officeName: 'Chandipur / Math Chandipur', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Haldia Sub-division',
            pincodes: [
              { pincode: '721607', officeName: 'Haldia Port / Township / IOCL Refinery', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721602', officeName: 'Haldia Petrochemicals / Supermarket Complex', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721657', officeName: 'Durgachak Industrial Hub / Haldia Energy', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721658', officeName: 'Sutahata / Chaitanyapur / Haldia Institute of Tech', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721631', officeName: 'Nandigram Town / Gokulnagar', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721656', officeName: 'Khejuri / Janka / Cowcolly Lighthouse', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721659', officeName: 'Kukrahati Ferry Ghat / Hooghly Riverfront', division: 'Tamluk', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Contai / Kanthi & Egra Sub-divisions',
            pincodes: [
              { pincode: '721401', officeName: 'Contai Head Post Office / Central Bus Terminus', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721428', officeName: 'Digha Sea Beach / Old Digha / Marine Aquarium', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721463', officeName: 'New Digha Sea Beach / Helipad / Amaravati Park', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721429', officeName: 'Egra Head Post Office / Hatbelda', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721430', officeName: 'Junput Sea Resort / Dried Fish Center / Kapalkundala Temple', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721441', officeName: 'Mandarmani Coastal Beach Resort / Dadanpatrabar', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721443', officeName: 'Ramnagar / Tajpur Beach Access / Shankarpur Fishing Harbour', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721444', officeName: 'Marishda / Kanthi Bypass', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721448', officeName: 'Potashpur / Belda Link', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721453', officeName: 'Bhagawanpur / Bhupatinagar', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721455', officeName: 'Bajkul / Itaberia / Bajkul Milani Mahavidyalaya', division: 'Contai', district: 'East Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'West Midnapore',
        subDivisions: [
          {
            name: 'Midnapore Sadar Sub-division',
            pincodes: [
              { pincode: '721101', officeName: 'Midnapore Head Post Office / Keranitola / Collectorate', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721102', officeName: 'Midnapore Vidyasagar University / Rangamati', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721121', officeName: 'Garhbeta / Gongoni Grand Canyon of Bengal', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721129', officeName: 'Salboni Currency Press (BRBNMPL) / Jindal Steel Belt', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721147', officeName: 'Goaltore / Pingboni Forest', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721150', officeName: 'Keshpur / Anandapur', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Kharagpur Sub-division',
            pincodes: [
              { pincode: '721301', officeName: 'Kharagpur Technology / IIT Kharagpur Campus', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721302', officeName: 'Kharagpur Railway Workshop / Golbazar Market', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721304', officeName: 'Hijli Detention Camp / Nehru Museum / Prembazar', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721305', officeName: 'Kharagpur Railway Settlement / Chhota Tengra', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721143', officeName: 'Debra Post Office / Balichak', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721424', officeName: 'Belda Sub Post Office / Keshiary Road', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721437', officeName: 'Dantan Heritage Site / Moghalmari Buddhist Monastery', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721445', officeName: 'Mohanpur / Egra Border', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721451', officeName: 'Narayangarh / Khakurda', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721458', officeName: 'Pingla / Naya Patachitra Artist Village', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721467', officeName: 'Sabang Madur Craft & Handloom Center', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Ghatal Sub-division',
            pincodes: [
              { pincode: '721212', officeName: 'Ghatal Head Post Office / Kushpata', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721201', officeName: 'Chandrakona Town / Ramgarh Fort Ruins', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721232', officeName: 'Kshirpai / Khirpai Babaji Mandir', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721238', officeName: 'Radhanagar (Raja Rammohan Roy Memorial)', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721242', officeName: 'Daspur / Sonakhali', division: 'Midnapore', district: 'West Midnapore', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Jhargram',
        subDivisions: [
          {
            name: 'Jhargram Sadar Sub-division',
            pincodes: [
              { pincode: '721507', officeName: 'Jhargram Head Post Office / Rajbari & Palace', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '721501', officeName: 'Belpahari / Ghagra Waterfalls & Tarafeny River', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721503', officeName: 'Chilkigarh Kanak Durga Temple & Sacred Grove', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721504', officeName: 'Gopiballavpur / Subarnarekha Riverfront', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721505', officeName: 'Jamboni / Gidhni Station', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721506', officeName: 'Lalgarh Forest Area / Ramgarh', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721513', officeName: 'Nayagram / Tapoban Rishi Valmiki Ashram', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721517', officeName: 'Sankrail Jhargram / Rohini', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '721518', officeName: 'Silda / Kakrajhor Jungle & Hills Gateway', division: 'Jhargram', district: 'Jhargram', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Murshidabad',
        subDivisions: [
          {
            name: 'Berhampore Sadar Sub-division',
            pincodes: [
              { pincode: '742101', officeName: 'Berhampore Head Post Office / Gorabazar / Mohona Bus Stand', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742102', officeName: 'Cossimbazar Rajbari / Berhampore Court Post Office', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742103', officeName: 'Khagra Silk Market / Bell Metal Craft Center', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742121', officeName: 'Beldanga Sub Post Office / Sugar Mill Area', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742136', officeName: 'Hariharpara / Choa', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742147', officeName: 'Jalangi Border Outpost / Padma Riverfront', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742163', officeName: 'Rejinagar / Andulbaria', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742165', officeName: 'Saktipur / Kandi Border', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742166', officeName: 'Naoda / Amtala Murshidabad', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Lalbagh Sub-division',
            pincodes: [
              { pincode: '742149', officeName: 'Murshidabad Hazarduari Palace / Nizamat Imambara / Katra Mosque', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742134', officeName: 'Bhagabangola / Nashipur Rajbari Link', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742135', officeName: 'Jiaganj Baluchari Silk Center / Azimganj Ferry', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742123', officeName: 'Azimganj Terracotta & Jain Heritage Temples', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742160', officeName: 'Lalgola Border Railway Terminal', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742162', officeName: 'Nabagram / Gram Salar', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Jangipur Sub-division',
            pincodes: [
              { pincode: '742213', officeName: 'Jangipur Sub Post Office / Municipal Area', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742225', officeName: 'Raghunathganj Head Post Office / Omarpur Junction', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742202', officeName: 'Dhulian Ganga River Port / Bidi Industry Center', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742212', officeName: 'Farakka Barrage Township / NTPC Super Thermal Power', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '742223', officeName: 'Sagardighi Thermal Power Station (SgTPS)', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742224', officeName: 'Suti / Ahiran Inland Port', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742226', officeName: 'Samserganj / Dhulian Rural', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Kandi & Domkal Sub-divisions',
            pincodes: [
              { pincode: '742137', officeName: 'Kandi Head Post Office / Rajbari Area', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742122', officeName: 'Bharatpur / Salar Link', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742132', officeName: 'Burwan / Kandi Rural', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742133', officeName: 'Domkal Post Office / Agricultural Hub', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742138', officeName: 'Khargram / Nagar', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '742159', officeName: 'Gokarna / Behrampore Link', division: 'Murshidabad', district: 'Murshidabad', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Darjeeling',
        subDivisions: [
          {
            name: 'Siliguri Sub-division',
            pincodes: [
              { pincode: '734001', officeName: 'Siliguri Head Post Office / Court / Hill Cart Rd', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734003', officeName: 'Sevoke Road Commercial Hub / Vega Circle Mall', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734004', officeName: 'Pradhannagar / Junction Bus Terminus / Champasari', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734005', officeName: 'Hakimpara / Bidhan Market / Siliguri College', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734006', officeName: 'Siliguri Town RS / Deshbandhupara / Subhaspally', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734007', officeName: 'Matigara / City Centre Mall / Khaprail', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734011', officeName: 'Bagdogra International Airport (IXB) / Air Force Stn', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734012', officeName: 'Kadamtala / North Bengal Medical College & Hospital (NBMCH)', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Express', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734013', officeName: 'North Bengal University (NBU) / Shiv Mandir / Raja Rammohunpur', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734014', officeName: 'Naxalbari Post Office / Hatighisa', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734426', officeName: 'Panitanki Nepal Border / Kakarbhitta Gateway / Kharibari', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734429', officeName: 'Phansidewa / Bidhannagar Terai Hub', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Darjeeling Sadar & Mirik Sub-divisions',
            pincodes: [
              { pincode: '734101', officeName: 'Darjeeling Head Post Office / Chowrasta / The Mall / Observatory Hill', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734102', officeName: 'Ghoom / Tiger Hill Sunrise Viewpoint / Batasia Loop / Yiga Choeling Monastery', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734104', officeName: 'Lebong Race Course / Happy Valley Tea Estate', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734121', officeName: 'Sonada Toy Train Stop / Gorato Peace Pagoda', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734122', officeName: 'Sukhia Pokhri / Manebhanjan (Sandakphu Trek Gateway) / Jorepokhri', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734123', officeName: 'Tukvar Tea Estate / Singla Bazar / Rangeet River', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '734125', officeName: 'Bijanbari / Pulbazar Hydro Project', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '734214', officeName: 'Mirik Lake Tourist Resort / Sumendu Lake / Bokar Monastery / Tingling Viewpoint', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734216', officeName: 'Soureni Tea Estate / Mirik Orange Orchards', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Kurseong Sub-division',
            pincodes: [
              { pincode: '734203', officeName: 'Kurseong Head Post Office / Eagles Crag / Makaibari Tea Estate', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734204', officeName: 'Dowhill Forest School / Deer Park / Victoria Boys School', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734217', officeName: 'Sukna Army Cantonment / Mahananda Wildlife Sanctuary Gate', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '734223', officeName: 'Tindharia Railway Heritage Workshop / DHR Loops', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734224', officeName: 'Mahanadi Tea Estate / Margaret\'s Hope', division: 'Darjeeling', district: 'Darjeeling', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Kalimpong',
        subDivisions: [
          {
            name: 'Kalimpong Sub-division',
            pincodes: [
              { pincode: '734301', officeName: 'Kalimpong Head Post Office / Deolo Hill / Durpin Dara Monastery / Morgan House', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734311', officeName: 'Algarah / Damsang Fort Ruins / Jhandi Dara', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '734312', officeName: 'Lava Hill Resort / Lava Monastery / Neora Valley National Park Entry', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '734314', officeName: 'Pedong Silk Route Post / Cross Hill / Sangchen Dorjee Monastery', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '734315', officeName: 'Rishyap & Kolakham Scenic Eco Villages', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '734316', officeName: 'Gorubathan / Sombaria Bazar / Chel River Valley', division: 'Darjeeling', district: 'Kalimpong', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
            ]
          }
        ]
      },
      {
        name: 'Jalpaiguri',
        subDivisions: [
          {
            name: 'Jalpaiguri Sadar Sub-division',
            pincodes: [
              { pincode: '735101', officeName: 'Jalpaiguri Head Post Office / Circuit Bench / Collectorate', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '735102', officeName: 'Dey Market / Dinbazar / Teesta Riverfront Jalpaiguri', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '735121', officeName: 'Belakoba Jute & Chamurchi Road', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735122', officeName: 'Mainaguri / Maynaguri Town / Jalpesh Shiva Temple', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735134', officeName: 'Rajganj / Fatapukur / Ambari Falakata', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735135', officeName: 'Raninagar Industrial Growth Centre', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '735210', officeName: 'Dhupguri Head Post Office / Agricultural Mandi', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735204', officeName: 'Banarhat Dooars Tea Hub / Chamurchi Bhutan Border', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Malbazar Sub-division',
            pincodes: [
              { pincode: '735221', officeName: 'Malbazar Sub Post Office / Caltex More', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735205', officeName: 'Birpara Dooars Commercial Center', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735206', officeName: 'Binnaguri Army Cantonment & Military Station', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735207', officeName: 'Chalasa / Gorumara National Park Safari Entry / Murti Riverfront', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735219', officeName: 'Lataguri Wildlife Eco Resort Hub / Gorumara South', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735222', officeName: 'Matelli / Samsing / Suntalekhola Hanging Bridge / Rocky Island', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735223', officeName: 'Nagrakata Sub Post Office / Jaldhaka Hydel', division: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Cooch Behar',
        subDivisions: [
          {
            name: 'Cooch Behar Sadar Sub-division',
            pincodes: [
              { pincode: '736101', officeName: 'Cooch Behar Head Post Office / Victor Jubilee Palace / Madan Mohan Temple', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736170', officeName: 'Cooch Behar Bazar / New Town / Bhabaniganj Bazar', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736179', officeName: 'Pundibari Uttar Banga Krishi Viswavidyalaya (UBKV)', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Dinhata & Mathabhanga Sub-divisions',
            pincodes: [
              { pincode: '736135', officeName: 'Dinhata Head Post Office / Sahebganj', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736146', officeName: 'Mathabhanga Post Office / Mansai Riverfront', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736156', officeName: 'Sitai Indo-Bangladesh Border Area', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '736167', officeName: 'Sitalkuchi / Gosairhat / Kholta', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
            ]
          },
          {
            name: 'Mekhliganj & Tufanganj Sub-divisions',
            pincodes: [
              { pincode: '735304', officeName: 'Mekhliganj / Tin Bigha Corridor / Teesta Bridge', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '735303', officeName: 'Haldibari Indo-Bangla International Rail Link / Dewanganj', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736159', officeName: 'Tufanganj Sub Post Office / Raidak River Basin', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736160', officeName: 'Baxirhat Assam Border Gateway / Jorai', division: 'Cooch Behar', district: 'Cooch Behar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Malda',
        subDivisions: [
          {
            name: 'Malda Sadar / English Bazar Sub-division',
            pincodes: [
              { pincode: '732101', officeName: 'Malda Head Post Office / English Bazar / Rathbari', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '732102', officeName: 'Mahanandapally / Mangalbari / Malda Town Railway Jn', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '732103', officeName: 'Old Malda Historic Town / Gour Kingdom Ruins', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732124', officeName: 'Adina Mosque & Deer Park / Pandua / Gazole', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732127', officeName: 'Kaliachak Silk / Commercial Hub / Silampur', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732128', officeName: 'Manikchak Ganga Riverfront / Ghat Area', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732138', officeName: 'Habibpur / Bulbulchandi / Kendpukur', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732142', officeName: 'Baisnabnagar Border Area / 18 Mile', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732144', officeName: 'Gour Historic Site / Baro Sona Mosque / Dakhil Darwaza / Firoz Minar', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732147', officeName: 'Bamangola / Pakuahat Agricultural Market', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732207', officeName: 'Sujapur Mango / Silk Hub / NH12 Belt', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
            ]
          },
          {
            name: 'Chanchal Sub-division',
            pincodes: [
              { pincode: '732123', officeName: 'Chanchal Head Post Office / Chanchal Rajbari', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732125', officeName: 'Harischandrapur Sub Post Office / Tulshihata', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732139', officeName: 'Ratua Commercial Town / Pukhuria', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732140', officeName: 'Samsi Railway Junction Area / College', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732201', officeName: 'Bhaluka Road / Mahananda Basin', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '732205', officeName: 'Kushida / Harischandrapur North', division: 'Malda', district: 'Malda', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
            ]
          }
        ]
      },
      {
        name: 'Bankura',
        subDivisions: [
          {
            name: 'Bankura Sadar Sub-division',
            pincodes: [
              { pincode: '722101', officeName: 'Bankura Head Post Office / Machantala', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '722102', officeName: 'Kenduadihi / Bankura Sammilani Med College', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '722132', officeName: 'Chhatna / Susunia Hill Archaeological Site', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722133', officeName: 'Gangajalghati / Amar Kanan', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722143', officeName: 'Mejia Thermal Power Station (MTPS)', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722144', officeName: 'Onda Post Office / Ramsagar', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722155', officeName: 'Saltora / Biharinath Hill Gateway', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722202', officeName: 'Barjora Industrial Area / Durgapur Barrage Link', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '722203', officeName: 'Beliatore / Jamini Roy Birthplace', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Bishnupur Sub-division',
            pincodes: [
              { pincode: '722122', officeName: 'Bishnupur Head Post Office / Rasmancha & Terracotta Temples', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '722138', officeName: 'Joypur Forest Resort / Sal Forest', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722141', officeName: 'Kotulpur Sub Post Office', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722205', officeName: 'Indas / Rol', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722206', officeName: 'Patrasayer / Jamkuri', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722207', officeName: 'Sonamukhi Silk & Terracotta Town', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Khatra Sub-division',
            pincodes: [
              { pincode: '722140', officeName: 'Khatra Head Post Office', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722135', officeName: 'Gorabari / Mukutmanipur Kangsabati Dam', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722148', officeName: 'Ranibandh / Jhilimili Forest Range', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722149', officeName: 'Raipur / Matgoda', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722150', officeName: 'Sarenga / Bikrampur', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722151', officeName: 'Simlapal / Harmasra', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '722152', officeName: 'Taldangra / Panchmura Terracotta Horse Village', division: 'Bankura', district: 'Bankura', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Purulia',
        subDivisions: [
          {
            name: 'Purulia Sadar Sub-division',
            pincodes: [
              { pincode: '723101', officeName: 'Purulia Head Post Office / Court Road', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723102', officeName: 'Dulminadiha / Saheb Bandh', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723103', officeName: 'Namopara / Purulia Station Road', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723104', officeName: 'Sainik School Purulia / Bongabari', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723128', officeName: 'Kashipur Rajbari Heritage Area', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723130', officeName: 'Hura Post Office', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723151', officeName: 'Puncha / Kenduadih', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Raghunathpur Sub-division',
            pincodes: [
              { pincode: '723133', officeName: 'Raghunathpur Sub Post Office', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723121', officeName: 'Adra Railway Division HQ / Colony', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723126', officeName: 'Anara RS / Railway Junction', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723132', officeName: 'Panchakotraj / Garhpanchkot Hill & Panchet Dam', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723145', officeName: 'Santaldih Thermal Power Station (STPS)', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723155', officeName: 'Para / Deoli Temple Area', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Jhalda, Manbazar & Baghmundi Sub-divisions',
            pincodes: [
              { pincode: '723202', officeName: 'Jhalda Town / Norrah', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723152', officeName: 'Bagmundi / Ayodhya Hills / Upper & Lower Dam', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723127', officeName: 'Balarampur / Barabhum / Lac & Chhau Hub', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723131', officeName: 'Manbazar / Kangsabati Confluence', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723129', officeName: 'Bandwan / Kuilapal Forest Belt', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 4 },
              { pincode: '723212', officeName: 'Tulin / Subarnarekha Riverfront', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723201', officeName: 'Joypur Purulia / Joypur Forest', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '723154', officeName: 'Sirkabad / Ayodhya Foothills', division: 'Purulia', district: 'Purulia', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Uttar Dinajpur',
        subDivisions: [
          {
            name: 'Raiganj Sadar Sub-division',
            pincodes: [
              { pincode: '733134', officeName: 'Raiganj Head Post Office / Kulik Bird Sanctuary / Raiganj University', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '733128', officeName: 'Itahar / Patirajpur', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733129', officeName: 'Kaliyaganj / Radhikapur Indo-Bangla Border Railway Link', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733130', officeName: 'Karnojora District HQ / Hemtabad / Bahin', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733156', officeName: 'Bindole / Buridighi', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Islampur Sub-division',
            pincodes: [
              { pincode: '733202', officeName: 'Islampur Head Post Office / Siliguri Highway Belt', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733201', officeName: 'Dalkhola Railway Junction / Agro Processing Mandi', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733207', officeName: 'Chopra Tea Gardens / Ramganj / NH27 Corridor', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733208', officeName: 'Panjipara / Islampur Rural', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733209', officeName: 'Kanki / Kishanganj Border', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733210', officeName: 'Goalpokher / Lodhan', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733215', officeName: 'Karandighi / Tungidighi Agricultural Center', division: 'Dinajpur', district: 'Uttar Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Dakshin Dinajpur',
        subDivisions: [
          {
            name: 'Balurghat Sadar Sub-division',
            pincodes: [
              { pincode: '733101', officeName: 'Balurghat Head Post Office / Collectorate / Mangalpur', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '733102', officeName: 'Chakvrigu / Balurghat College / Atreyee Riverfront', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '733103', officeName: 'Beltala Park / Raghunathpur Commercial Hub', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '733126', officeName: 'Hili Indo-Bangladesh Land Port & Border Outpost', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733127', officeName: 'Tapan / Tapan Dighi Historic Lake', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733133', officeName: 'Patiram / Balurghat Rural', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733141', officeName: 'Kumarganj / Gopalganj Border', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          },
          {
            name: 'Gangarampur Sub-division',
            pincodes: [
              { pincode: '733124', officeName: 'Gangarampur Head Post Office / Bangarh Archaeological Site', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 2 },
              { pincode: '733121', officeName: 'Buniadpur Sub-division Center / Railway Station', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733125', officeName: 'Harirampur / Shirshi', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '733132', officeName: 'Kushmandi / Wooden Mask Mukha Craft Artisans Hub', division: 'Dinajpur', district: 'Dakshin Dinajpur', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      },
      {
        name: 'Alipurduar',
        subDivisions: [
          {
            name: 'Alipurduar Sadar Sub-division',
            pincodes: [
              { pincode: '736121', officeName: 'Alipurduar Head Post Office / Buxa Tiger Reserve Gateway', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736122', officeName: 'Alipurduar Court / Parade Ground', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736123', officeName: 'Alipurduar Junction Railway Hub / New Alipurduar', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735211', officeName: 'Falakata Commercial Hub / Jaldapara South Entry', division: 'Jalpaiguri', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735214', officeName: 'Hamiltonganj / Kalchini Dooars Tea', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735215', officeName: 'Hasimara Air Force Station / Jaldapara National Park Rhino Gateway / Madarihat', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '735217', officeName: 'Kalchini / Rajabhatkhawa Nature Interpretation / Jayanti Buxa Fort Trail', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736182', officeName: 'Jaigaon / Phuentsholing Bhutan International Border Gate', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736202', officeName: 'Kamakhyaguri Sub Post Office / Shamuktala', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736203', officeName: 'Kumargramduar / Sankosh River / Assam Border', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736207', officeName: 'Barobisha / Assam Interstate Border Gateway', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
              { pincode: '736208', officeName: 'Salsalabari / Damanpur / Buxa Buffer Zone', division: 'Cooch Behar', district: 'Alipurduar', state: 'West Bengal', deliveryType: 'Standard', codAvailable: true, isActive: true, transitDays: 3 },
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Fetch dynamic post offices by division or district from postal API when needed
 */
export async function fetchOnlinePostOfficesByBranch(branchOrPlace: string): Promise<PincodeRecord[]> {
  try {
    const clean = branchOrPlace.trim();
    if (!clean || clean.length < 3) return [];
    const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(clean)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice)) {
      return data[0].PostOffice.map((po: any) => ({
        pincode: po.Pincode || '',
        officeName: po.Name || '',
        division: po.Division || '',
        district: po.District || '',
        state: po.State || '',
        deliveryType: 'Standard',
        codAvailable: true,
        isActive: true,
        transitDays: 3,
      }));
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch postal branch data:', err);
    return [];
  }
}

import { evaluatePincodeServiceability } from './canonicalPincodeService';

/**
 * Checks whether a given pincode is covered by delivery settings.
 * Canonical implementation using exact 6-digit PIN rules.
 */
export function isPincodeServiceable(
  pincode: string,
  coverageConfig?: DeliveryCoverageConfig
): {
  serviceable: boolean;
  deliveryType: 'Standard' | 'Express' | 'SameDay';
  codAvailable: boolean;
  transitDays: number;
  reason?: string;
} {
  const result = evaluatePincodeServiceability(pincode, coverageConfig);
  return {
    serviceable: result.serviceable,
    deliveryType: result.deliveryType,
    codAvailable: result.codAvailable,
    transitDays: result.transitDays,
    reason: result.reason,
  };
}
